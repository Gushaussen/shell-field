import io
import threading
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from flask import Flask, request, Response, jsonify
app=Flask(__name__)
app.config['MAX_CONTENT_LENGTH']=2*1024*1024
lock=threading.Lock()
FEATURES={'area','boundary','width','height','aspect','holes'}
KINDS={'scatter','regression','residual','histogram','density','ecdf','strip','swarm','box','violin','boxen','count','point','heatmap','correlation','cluster','joint','pair'}
def render(p):
    chart=p.get('chart'); x=p.get('x'); y=p.get('y'); group=p.get('group'); fmt=p.get('format')
    if chart not in KINDS or x not in FEATURES or y not in FEATURES or group not in {'species','side','specimen'} or fmt not in {'png','svg'}:
        raise ValueError('Invalid chart settings')
    jobs=p.get('results')
    if not isinstance(jobs,list) or not 1<=len(jobs)<=200:
        raise ValueError('Select 1–200 analysed sides')
    rows=[]; units={key:set() for key in FEATURES}
    for index,j in enumerate(jobs):
        if not isinstance(j,dict): raise ValueError('Invalid analysis record')
        m=j.get('metrics') or {}
        if not isinstance(m,dict): raise ValueError('Invalid metric record')
        row={'specimen':str(j.get('name') or j.get('id') or index)[:80]+' / '+str(j.get('side',''))[:20]+f' [{index+1}]','species':str(j.get('species','unidentified'))[:80],'side':str(j.get('side','unknown'))[:30]}
        for key in FEATURES:
            value=m.get(key)
            row[key]=float(value) if isinstance(value,(int,float)) and not isinstance(value,bool) and np.isfinite(value) else np.nan
            if np.isfinite(row[key]): units[key].add('dimensionless' if key in {'aspect','holes'} else str(m.get('unit','px')))
        rows.append(row)
    df=pd.DataFrame(rows)
    matrix=chart in {'heatmap','correlation','cluster','pair'}
    features=p.get('features',[]) if matrix else ([] if chart=='count' else [x,y] if chart in {'scatter','regression','residual','joint'} else [y])
    if not isinstance(features,list) or any(k not in FEATURES for k in features): raise ValueError('Invalid matrix characteristics')
    features=list(dict.fromkeys(features))
    if matrix and not 2<=len(features)<=6: raise ValueError('Select 2–6 matrix characteristics')
    for key in features:
        if len(units[key])>1: raise ValueError('Mixed units for '+key+'; select sides with matching source units')
    data=df.dropna(subset=features) if features else df
    if data.empty: raise ValueError('No complete values for this selection')
    if chart in {'regression','residual','joint','density','violin','correlation','cluster','pair'} and len(data)<3: raise ValueError('This chart needs at least three complete analysed sides')
    if chart in {'regression','residual','joint'} and data[x].nunique()<2: raise ValueError('X characteristic must vary')
    if chart in {'density','violin'}:
        if any(len(part)<3 or part[y].nunique()<2 for _,part in data.groupby(group)): raise ValueError('Each density group needs at least three values and nonzero variation')
    if chart in {'correlation','cluster'} and any(data[k].nunique()<2 for k in features): raise ValueError('Remove constant characteristics from this matrix')
    with lock:
        sns.set_theme(style='whitegrid')
        fig=None
        try:
            if chart=='pair':
                grid=sns.pairplot(data,vars=features,hue=group,diag_kind='hist',height=2); fig=grid.figure
            elif chart=='joint':
                grid=sns.jointplot(data=data,x=x,y=y,hue=group,kind='scatter',marginal_kws={'fill':False},height=7); fig=grid.figure
            elif chart=='cluster':
                table=data.set_index('specimen')[features]
                if p.get('normalize'): table=(table-table.mean())/table.std(ddof=0)
                grid=sns.clustermap(table,cmap='viridis',figsize=(10,8)); fig=grid.figure
            else:
                fig,ax=plt.subplots(figsize=(11,7))
                if chart=='scatter': sns.scatterplot(data=data,x=x,y=y,hue=group,ax=ax)
                elif chart=='regression': sns.regplot(data=data,x=x,y=y,ci=None,ax=ax)
                elif chart=='residual': sns.residplot(data=data,x=x,y=y,ax=ax)
                elif chart=='histogram': sns.histplot(data=data,x=y,hue=group,ax=ax)
                elif chart=='density': sns.kdeplot(data=data,x=y,hue=group,common_norm=False,ax=ax)
                elif chart=='ecdf': sns.ecdfplot(data=data,x=y,hue=group,ax=ax)
                elif chart=='strip': sns.stripplot(data=data,x=group,y=y,ax=ax)
                elif chart=='swarm': sns.swarmplot(data=data,x=group,y=y,size=4,ax=ax)
                elif chart=='box': sns.boxplot(data=data,x=group,y=y,ax=ax)
                elif chart=='violin': sns.violinplot(data=data,x=group,y=y,cut=0,ax=ax)
                elif chart=='boxen': sns.boxenplot(data=data,x=group,y=y,ax=ax)
                elif chart=='count': sns.countplot(data=data,x=group,ax=ax)
                elif chart=='point': sns.pointplot(data=data,x=group,y=y,errorbar=None,ax=ax)
                elif chart in {'heatmap','correlation'}:
                    table=data.set_index('specimen')[features]
                    if chart=='correlation': table=table.corr()
                    elif p.get('normalize'):
                        scale=table.std(ddof=0).replace(0,1); table=(table-table.mean())/scale
                    sns.heatmap(table,cmap='vlag' if chart=='correlation' else 'viridis',annot=chart=='correlation',ax=ax)
                if chart not in {'heatmap','correlation'}:
                    if chart in {'scatter','regression','residual'}: ax.set_xlabel(x+' / '+next(iter(units[x]),''))
                    if chart in {'histogram','density','ecdf'}: ax.set_xlabel(y+' / '+next(iter(units[y]),''))
                    elif chart!='count': ax.set_ylabel(y+' / '+next(iter(units[y]),''))
                    ax.tick_params(axis='x',labelrotation=35)
            fig.suptitle(str(p.get('title','Shell library artifact'))[:160],y=1.02)
            caption='Library-derived visual artifact | batch '+str(p.get('batchId',''))[:36]+' | revision '+str(p.get('revision',''))[:12]
            fig.text(.01,-.04,caption,fontsize=7)
            stream=io.BytesIO(); fig.savefig(stream,format=fmt,dpi=180,bbox_inches='tight')
            return stream.getvalue(), 'image/png' if fmt=='png' else 'image/svg+xml'
        finally:
            if fig is not None: plt.close(fig)
@app.route('/api/diagram-expanded',methods=['POST'])
def diagram():
    try:
        payload=request.get_json(silent=True)
        if not isinstance(payload,dict): raise ValueError('Expected a diagram request')
        image,mime=render(payload)
        return Response(image,mimetype=mime,headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'})
    except (ValueError,TypeError,KeyError) as error: return jsonify(error=str(error)),400
    except Exception:
        app.logger.exception('Expanded diagram failed')
        return jsonify(error='Rendering failed; inspect deployment logs'),500
