import io
import math
import threading
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
from flask import Flask, Response, jsonify, request
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024
lock = threading.Lock()
METRICS = {'area', 'boundary', 'width', 'height', 'aspect', 'holes'}
def number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)
def render(payload):
    chart = payload.get('chart')
    metric = payload.get('metric')
    output_format = payload.get('format', 'png')
    if chart not in {'bar', 'profile'} or metric not in METRICS or output_format not in {'png', 'svg'}:
        raise ValueError('Unsupported diagram settings')
    results = payload.get('results')
    if not isinstance(results, list) or not 1 <= len(results) <= 200:
        raise ValueError('Choose between 1 and 200 analysed sides')
    rows = []
    expected_unit = str(payload.get('unit', ''))[:40]
    for index, job in enumerate(results):
        if not isinstance(job, dict):
            raise ValueError('Invalid analysis record')
        label = str(job.get('name') or job.get('id') or index)[:100] + ' / ' + str(job.get('side', ''))[:20] + f' [{index+1}]'
        if chart == 'bar':
            metrics = job.get('metrics') or {}
            value = metrics.get(metric)
            unit = 'dimensionless' if metric in {'aspect', 'holes'} else metrics.get('unit', 'px')
            if number(value) and unit == expected_unit:
                rows.append({'specimen': label, 'value': value})
        else:
            points = job.get('widthProfile') or []
            if not isinstance(points, list) or len(points) > 2000:
                raise ValueError('Invalid or oversized width profile')
            for point in points:
                if isinstance(point, dict) and number(point.get('fraction')) and number(point.get('width')) and point.get('unit', 'px') == expected_unit:
                    rows.append({'specimen': label, 'position': point['fraction'], 'value': point['width']})
    if not rows or len(rows) > 20000:
        raise ValueError('No usable values for this selection, or more than 20,000 points')
    frame = pd.DataFrame(rows)
    with lock:
        sns.set_theme(style='whitegrid')
        fig, ax = plt.subplots(figsize=(12, 7))
        try:
            if chart == 'bar':
                sns.barplot(data=frame, x='specimen', y='value', color='#0648ff', errorbar=None, ax=ax)
                ax.tick_params(axis='x', labelrotation=65)
                ax.set_xlabel('Analysed library side')
            else:
                sns.lineplot(data=frame, x='position', y='value', hue='specimen', estimator=None, errorbar=None, ax=ax)
                ax.set_xlabel('Image-vertical profile position')
            suffix = ' squared' if chart == 'bar' and metric == 'area' else ''
            ax.set_ylabel(('Width' if chart == 'profile' else metric) + ' / ' + expected_unit + suffix)
            ax.set_title(str(payload.get('title', 'Shell library diagram'))[:160], wrap=True)
            caption = 'Library-derived visual artifact | batch ' + str(payload.get('batchId', ''))[:36] + ' | revision ' + str(payload.get('revision', ''))[:12]
            fig.text(0.02, 0.01, caption, fontsize=7)
            fig.tight_layout(rect=(0, 0.05, 1, 1))
            stream = io.BytesIO()
            fig.savefig(stream, format=output_format, dpi=180, bbox_inches='tight')
            return stream.getvalue(), 'image/svg+xml' if output_format == 'svg' else 'image/png'
        finally:
            plt.close(fig)
@app.route('/api/diagram', methods=['POST'])
def diagram():
    try:
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            raise ValueError('Expected a diagram request')
        image, mime = render(payload)
        return Response(image, mimetype=mime, headers={'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'})
    except (ValueError, TypeError, KeyError) as error:
        return jsonify(error=str(error)), 400
    except Exception:
        app.logger.exception('Diagram rendering failed')
        return jsonify(error='Diagram rendering failed; inspect deployment logs'), 500
