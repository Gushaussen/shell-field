import io
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
from flask import Flask, Response, jsonify, request

app = Flask(__name__)
CHARTS = {"bar", "strip", "box", "violin", "hist", "kde", "scatter", "line", "heatmap", "correlation"}
PALETTES = {"cobalt": ["#0648ff", "#4d7dff", "#98b3ff", "#001a4d"]}

def _frame(data):
    if not isinstance(data, list) or not data:
        raise ValueError("Diagram data must contain at least one record")
    if len(data) > 20000:
        raise ValueError("Diagram input exceeds the 20,000-record limit")
    frame = pd.DataFrame(data)
    if frame.empty:
        raise ValueError("Diagram data is empty")
    return frame

def _render(spec, frame):
    chart = spec.get("chart")
    if chart not in CHARTS:
        raise ValueError("Unsupported diagram type")
    x = spec.get("x") or ""
    y = spec.get("y") or ""
    hue = spec.get("hue") or None
    palette = PALETTES.get(spec.get("palette"), PALETTES["cobalt"])
    sns.set_theme(style="whitegrid", font_scale=0.8)
    fig, ax = plt.subplots(figsize=(10, 6))
    try:
        if chart == "bar":
            sns.barplot(data=frame, x=x, y=y, hue=hue, palette=palette, ax=ax)
        elif chart == "strip":
            sns.stripplot(data=frame, x=x, y=y, hue=hue, palette=palette, ax=ax)
        elif chart == "box":
            sns.boxplot(data=frame, x=x, y=y, hue=hue, palette=palette, ax=ax)
        elif chart == "violin":
            sns.violinplot(data=frame, x=x, y=y, hue=hue, palette=palette, ax=ax)
        elif chart == "hist":
            sns.histplot(data=frame, x=y, hue=hue, palette=palette, ax=ax)
        elif chart == "kde":
            sns.kdeplot(data=frame, x=y, hue=hue, palette=palette, fill=True, ax=ax)
        elif chart == "scatter":
            second = spec.get("secondMetric")
            if not second:
                raise ValueError("Scatter diagrams require a second metric")
            wide = frame.pivot_table(index=["specimenId", "side"], columns="quantity", values="value", aggfunc="first").reset_index()
            if second not in wide or y not in wide:
                raise ValueError("Selected metrics are not available together")
            sns.scatterplot(data=wide, x=y, y=second, hue=hue, palette=palette, ax=ax)
            ax.set_ylabel(second)
        elif chart == "line":
            sns.lineplot(data=frame, x=x, y=y, hue=hue, palette=palette, ax=ax)
        elif chart == "heatmap":
            table = frame.pivot_table(index=x, columns=hue or "quantity", values=y, aggfunc="mean")
            if table.empty:
                raise ValueError("Not enough records for a heatmap")
            sns.heatmap(table, cmap=sns.light_palette(palette[0], as_cmap=True), ax=ax)
        elif chart == "correlation":
            second = spec.get("secondMetric")
            if not second:
                raise ValueError("Correlation diagrams require a second metric")
            wide = frame.pivot_table(index=["specimenId", "side"], columns="quantity", values="value", aggfunc="first")
            if y not in wide or second not in wide:
                raise ValueError("Selected metrics are not available together")
            correlation = wide[[y, second]].corr()
            sns.heatmap(correlation, annot=True, cmap=sns.light_palette(palette[0], as_cmap=True), ax=ax)
        ax.set_title(spec.get("title") or "Shell Field library diagram")
        ax.set_xlabel(spec.get("xLabel") or x)
        ax.set_ylabel(spec.get("yLabel") or y)
        fig.tight_layout()
        output = io.BytesIO()
        if spec.get("format") == "svg":
            fig.savefig(output, format="svg", bbox_inches="tight")
            mime = "image/svg+xml"
        else:
            fig.savefig(output, format="png", dpi=180, bbox_inches="tight")
            mime = "image/png"
        return output.getvalue(), mime
    finally:
        plt.close(fig)

@app.after_request
def _headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response

@app.route("/api/diagram", methods=["POST", "OPTIONS"])
def diagram():
    if request.method == "OPTIONS":
        return Response(status=204)
    try:
        payload = request.get_json(silent=True) or {}
        spec = payload.get("spec")
        if not isinstance(spec, dict):
            raise ValueError("Diagram specification is missing")
        frame = _frame(payload.get("data"))
        image, mime = _render(spec, frame)
        return Response(image, mimetype=mime)
    except (ValueError, KeyError, TypeError) as error:
        return jsonify({"error": str(error)}), 400
    except Exception:
        return jsonify({"error": "Diagram generation failed"}), 500
