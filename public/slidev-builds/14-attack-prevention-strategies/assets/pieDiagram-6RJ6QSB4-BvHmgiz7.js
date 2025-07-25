import{p as N}from"./chunk-K2ZEYYM2-DkkM3Zc1.js";import{p as B}from"./treemap-75Q7IDZK-SV5UZEO6-D5jzyTyH.js";import{a as i,g as U,s as V,b as Z,c as j,v as q,t as H,l as C,d as J,G as K,a7 as Q,a9 as X,aa as z,ab as Y,f as ee,A as te,ac as ae,I as re}from"./Mermaid.vue_vue_type_script_setup_true_lang-Dlg4mmDj.js";import"./chunk-TGZYFRKZ-D6phesDM.js";import"./index-C4m-ckJW.js";import"./modules/vue-bjj11fbb.js";import"./modules/shiki-CXfI5ll3.js";import"./modules/file-saver-C8BEGaqa.js";var ie=re.pie,D={sections:new Map,showData:!1},h=D.sections,w=D.showData,se=structuredClone(ie),oe=i(()=>structuredClone(se),"getConfig"),ne=i(()=>{h=new Map,w=D.showData,te()},"clear"),le=i(({label:e,value:t})=>{h.has(e)||(h.set(e,t),C.debug(`added new section: ${e}, with value: ${t}`))},"addSection"),ce=i(()=>h,"getSections"),de=i(e=>{w=e},"setShowData"),pe=i(()=>w,"getShowData"),G={getConfig:oe,clear:ne,setDiagramTitle:H,getDiagramTitle:q,setAccTitle:j,getAccTitle:Z,setAccDescription:V,getAccDescription:U,addSection:le,getSections:ce,setShowData:de,getShowData:pe},ge=i((e,t)=>{N(e,t),t.setShowData(e.showData),e.sections.map(t.addSection)},"populateDb"),ue={parse:i(async e=>{const t=await B("pie",e);C.debug(t),ge(t,G)},"parse")},fe=i(e=>`
  .pieCircle{
    stroke: ${e.pieStrokeColor};
    stroke-width : ${e.pieStrokeWidth};
    opacity : ${e.pieOpacity};
  }
  .pieOuterCircle{
    stroke: ${e.pieOuterStrokeColor};
    stroke-width: ${e.pieOuterStrokeWidth};
    fill: none;
  }
  .pieTitleText {
    text-anchor: middle;
    font-size: ${e.pieTitleTextSize};
    fill: ${e.pieTitleTextColor};
    font-family: ${e.fontFamily};
  }
  .slice {
    font-family: ${e.fontFamily};
    fill: ${e.pieSectionTextColor};
    font-size:${e.pieSectionTextSize};
    // fill: white;
  }
  .legend text {
    fill: ${e.pieLegendTextColor};
    font-family: ${e.fontFamily};
    font-size: ${e.pieLegendTextSize};
  }
`,"getStyles"),he=fe,me=i(e=>{const t=[...e.entries()].map(s=>({label:s[0],value:s[1]})).sort((s,n)=>n.value-s.value);return ae().value(s=>s.value)(t)},"createPieArcs"),ve=i((e,t,F,s)=>{C.debug(`rendering pie chart
`+e);const n=s.db,y=J(),T=K(n.getConfig(),y.pie),$=40,o=18,p=4,c=450,m=c,v=Q(t),l=v.append("g");l.attr("transform","translate("+m/2+","+c/2+")");const{themeVariables:a}=y;let[A]=X(a.pieOuterStrokeWidth);A??=2;const _=T.textPosition,g=Math.min(m,c)/2-$,W=z().innerRadius(0).outerRadius(g),I=z().innerRadius(g*_).outerRadius(g*_);l.append("circle").attr("cx",0).attr("cy",0).attr("r",g+A/2).attr("class","pieOuterCircle");const b=n.getSections(),S=me(b),M=[a.pie1,a.pie2,a.pie3,a.pie4,a.pie5,a.pie6,a.pie7,a.pie8,a.pie9,a.pie10,a.pie11,a.pie12],d=Y(M);l.selectAll("mySlices").data(S).enter().append("path").attr("d",W).attr("fill",r=>d(r.data.label)).attr("class","pieCircle");let E=0;b.forEach(r=>{E+=r}),l.selectAll("mySlices").data(S).enter().append("text").text(r=>(r.data.value/E*100).toFixed(0)+"%").attr("transform",r=>"translate("+I.centroid(r)+")").style("text-anchor","middle").attr("class","slice"),l.append("text").text(n.getDiagramTitle()).attr("x",0).attr("y",-400/2).attr("class","pieTitleText");const x=l.selectAll(".legend").data(d.domain()).enter().append("g").attr("class","legend").attr("transform",(r,u)=>{const f=o+p,P=f*d.domain().length/2,R=12*o,L=u*f-P;return"translate("+R+","+L+")"});x.append("rect").attr("width",o).attr("height",o).style("fill",d).style("stroke",d),x.data(S).append("text").attr("x",o+p).attr("y",o-p).text(r=>{const{label:u,value:f}=r.data;return n.getShowData()?`${u} [${f}]`:u});const O=Math.max(...x.selectAll("text").nodes().map(r=>r?.getBoundingClientRect().width??0)),k=m+$+o+p+O;v.attr("viewBox",`0 0 ${k} ${c}`),ee(v,c,k,T.useMaxWidth)},"draw"),Se={draw:ve},_e={parser:ue,db:G,renderer:Se,styles:he};export{_e as diagram};
