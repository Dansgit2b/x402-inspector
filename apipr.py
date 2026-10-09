# fork + verified (API-created) commits + PR. usage: python3 apipr.py repo branch title body path1 localfile1 [path2 localfile2...]
import os,sys,json,base64,time,urllib.request
T=os.environ['GH_TOKEN'];R,BR,TI,BO=sys.argv[1:5];files=sys.argv[5:]
def api(m,u,d=None):
    q=urllib.request.Request('https://api.github.com'+u,method=m,data=json.dumps(d).encode() if d is not None else None,headers={'Authorization':'token '+T,'Accept':'application/vnd.github+json'})
    try:return json.load(urllib.request.urlopen(q))
    except urllib.error.HTTPError as e: return {'_err':e.code,'msg':e.read().decode()[:300]}
api('POST',f'/repos/{R}/forks',{});time.sleep(10);N=R.split('/')[1];F=f'Dansgit2b/{N}'
base=api('GET',f'/repos/{R}')['default_branch'];sha=api('GET',f'/repos/{R}/git/ref/heads/{base}')['object']['sha']
api('PATCH',f'/repos/{F}/git/refs/heads/{base}',{'sha':sha,'force':False})
print(api('POST',f'/repos/{F}/git/refs',{'ref':'refs/heads/'+BR,'sha':sha}).get('ref'))
for p,l in zip(files[::2],files[1::2]):
    ex=api('GET',f'/repos/{F}/contents/{p}?ref={BR}');d={'message':f'Add x402 Inspector: {p.split("/")[-1]}','content':base64.b64encode(open(l,'rb').read()).decode(),'branch':BR}
    if 'sha' in ex:d['sha']=ex['sha']
    r=api('PUT',f'/repos/{F}/contents/{p}',d);print(p,r.get('commit',{}).get('verification',{}).get('verified'),r.get('_err'))
r=api('POST',f'/repos/{R}/pulls',{'title':TI,'head':'Dansgit2b:'+BR,'base':base,'body':BO});print(r.get('html_url') or r)
