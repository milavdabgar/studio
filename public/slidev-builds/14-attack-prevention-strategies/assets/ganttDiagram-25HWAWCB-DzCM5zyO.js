import{a as l,g as ot,s as ct,v as lt,t as ut,b as dt,c as ft,d as ce,e as pe,L as ht,M as kt,N as mt,f as yt,O as gt,P as pt,k as de,l as be,Q as vt,R as je,S as Be,T as Tt,U as bt,V as xt,W as _t,X as wt,Y as Dt,Z as St,$ as qe,a0 as Ge,a1 as He,a2 as Xe,a3 as Ue,a4 as Ct,m as Et,A as Mt,a5 as Je,r as It,u as At,a6 as Ie}from"./Mermaid.vue_vue_type_script_setup_true_lang-Dlg4mmDj.js";import"./modules/vue-bjj11fbb.js";import"./index-C4m-ckJW.js";import"./modules/shiki-CXfI5ll3.js";import"./modules/file-saver-C8BEGaqa.js";var Lt=Ie({"../../node_modules/.pnpm/dayjs@1.11.13/node_modules/dayjs/plugin/isoWeek.js"(e,i){(function(r,s){typeof e=="object"&&typeof i<"u"?i.exports=s():typeof define=="function"&&define.amd?define(s):(r=typeof globalThis<"u"?globalThis:r||self).dayjs_plugin_isoWeek=s()})(e,function(){var r="day";return function(s,n,m){var f=l(function(M){return M.add(4-M.isoWeekday(),r)},"a"),w=n.prototype;w.isoWeekYear=function(){return f(this).year()},w.isoWeek=function(M){if(!this.$utils().u(M))return this.add(7*(M-this.isoWeek()),r);var g,I,O,P,j=f(this),S=(g=this.isoWeekYear(),I=this.$u,O=(I?m.utc:m)().year(g).startOf("year"),P=4-O.isoWeekday(),O.isoWeekday()>4&&(P+=7),O.add(P,r));return j.diff(S,"week")+1},w.isoWeekday=function(M){return this.$utils().u(M)?this.day()||7:this.day(this.day()%7?M:M-7)};var Y=w.startOf;w.startOf=function(M,g){var I=this.$utils(),O=!!I.u(g)||g;return I.p(M)==="isoweek"?O?this.date(this.date()-(this.isoWeekday()-1)).startOf("day"):this.date(this.date()-1-(this.isoWeekday()-1)+7).endOf("day"):Y.bind(this)(M,g)}}})}}),Ft=Ie({"../../node_modules/.pnpm/dayjs@1.11.13/node_modules/dayjs/plugin/customParseFormat.js"(e,i){(function(r,s){typeof e=="object"&&typeof i<"u"?i.exports=s():typeof define=="function"&&define.amd?define(s):(r=typeof globalThis<"u"?globalThis:r||self).dayjs_plugin_customParseFormat=s()})(e,function(){var r={LTS:"h:mm:ss A",LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY h:mm A",LLLL:"dddd, MMMM D, YYYY h:mm A"},s=/(\[[^[]*\])|([-_:/.,()\s]+)|(A|a|Q|YYYY|YY?|ww?|MM?M?M?|Do|DD?|hh?|HH?|mm?|ss?|S{1,3}|z|ZZ?)/g,n=/\d/,m=/\d\d/,f=/\d\d?/,w=/\d*[^-_:/,()\s\d]+/,Y={},M=l(function(p){return(p=+p)+(p>68?1900:2e3)},"a"),g=l(function(p){return function(C){this[p]=+C}},"f"),I=[/[+-]\d\d:?(\d\d)?|Z/,function(p){(this.zone||(this.zone={})).offset=function(C){if(!C||C==="Z")return 0;var L=C.match(/([+-]|\d\d)/g),F=60*L[1]+(+L[2]||0);return F===0?0:L[0]==="+"?-F:F}(p)}],O=l(function(p){var C=Y[p];return C&&(C.indexOf?C:C.s.concat(C.f))},"u"),P=l(function(p,C){var L,F=Y.meridiem;if(F){for(var q=1;q<=24;q+=1)if(p.indexOf(F(q,0,C))>-1){L=q>12;break}}else L=p===(C?"pm":"PM");return L},"d"),j={A:[w,function(p){this.afternoon=P(p,!1)}],a:[w,function(p){this.afternoon=P(p,!0)}],Q:[n,function(p){this.month=3*(p-1)+1}],S:[n,function(p){this.milliseconds=100*+p}],SS:[m,function(p){this.milliseconds=10*+p}],SSS:[/\d{3}/,function(p){this.milliseconds=+p}],s:[f,g("seconds")],ss:[f,g("seconds")],m:[f,g("minutes")],mm:[f,g("minutes")],H:[f,g("hours")],h:[f,g("hours")],HH:[f,g("hours")],hh:[f,g("hours")],D:[f,g("day")],DD:[m,g("day")],Do:[w,function(p){var C=Y.ordinal,L=p.match(/\d+/);if(this.day=L[0],C)for(var F=1;F<=31;F+=1)C(F).replace(/\[|\]/g,"")===p&&(this.day=F)}],w:[f,g("week")],ww:[m,g("week")],M:[f,g("month")],MM:[m,g("month")],MMM:[w,function(p){var C=O("months"),L=(O("monthsShort")||C.map(function(F){return F.slice(0,3)})).indexOf(p)+1;if(L<1)throw new Error;this.month=L%12||L}],MMMM:[w,function(p){var C=O("months").indexOf(p)+1;if(C<1)throw new Error;this.month=C%12||C}],Y:[/[+-]?\d+/,g("year")],YY:[m,function(p){this.year=M(p)}],YYYY:[/\d{4}/,g("year")],Z:I,ZZ:I};function S(p){var C,L;C=p,L=Y&&Y.formats;for(var F=(p=C.replace(/(\[[^\]]+])|(LTS?|l{1,4}|L{1,4})/g,function(x,T,k){var _=k&&k.toUpperCase();return T||L[k]||r[k]||L[_].replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g,function(c,u,h){return u||h.slice(1)})})).match(s),q=F.length,G=0;G<q;G+=1){var Q=F[G],H=j[Q],y=H&&H[0],b=H&&H[1];F[G]=b?{regex:y,parser:b}:Q.replace(/^\[|\]$/g,"")}return function(x){for(var T={},k=0,_=0;k<q;k+=1){var c=F[k];if(typeof c=="string")_+=c.length;else{var u=c.regex,h=c.parser,d=x.slice(_),v=u.exec(d)[0];h.call(T,v),x=x.replace(v,"")}}return function(a){var o=a.afternoon;if(o!==void 0){var t=a.hours;o?t<12&&(a.hours+=12):t===12&&(a.hours=0),delete a.afternoon}}(T),T}}return l(S,"l"),function(p,C,L){L.p.customParseFormat=!0,p&&p.parseTwoDigitYear&&(M=p.parseTwoDigitYear);var F=C.prototype,q=F.parse;F.parse=function(G){var Q=G.date,H=G.utc,y=G.args;this.$u=H;var b=y[1];if(typeof b=="string"){var x=y[2]===!0,T=y[3]===!0,k=x||T,_=y[2];T&&(_=y[2]),Y=this.$locale(),!x&&_&&(Y=L.Ls[_]),this.$d=function(d,v,a,o){try{if(["x","X"].indexOf(v)>-1)return new Date((v==="X"?1e3:1)*d);var t=S(v)(d),A=t.year,D=t.month,E=t.day,N=t.hours,W=t.minutes,V=t.seconds,$=t.milliseconds,ae=t.zone,ne=t.week,fe=new Date,he=E||(A||D?1:fe.getDate()),oe=A||fe.getFullYear(),z=0;A&&!D||(z=D>0?D-1:fe.getMonth());var U,B=N||0,ie=W||0,J=V||0,re=$||0;return ae?new Date(Date.UTC(oe,z,he,B,ie,J,re+60*ae.offset*1e3)):a?new Date(Date.UTC(oe,z,he,B,ie,J,re)):(U=new Date(oe,z,he,B,ie,J,re),ne&&(U=o(U).week(ne).toDate()),U)}catch{return new Date("")}}(Q,b,H,L),this.init(),_&&_!==!0&&(this.$L=this.locale(_).$L),k&&Q!=this.format(b)&&(this.$d=new Date("")),Y={}}else if(b instanceof Array)for(var c=b.length,u=1;u<=c;u+=1){y[1]=b[u-1];var h=L.apply(this,y);if(h.isValid()){this.$d=h.$d,this.$L=h.$L,this.init();break}u===c&&(this.$d=new Date(""))}else q.call(this,G)}}})}}),Yt=Ie({"../../node_modules/.pnpm/dayjs@1.11.13/node_modules/dayjs/plugin/advancedFormat.js"(e,i){(function(r,s){typeof e=="object"&&typeof i<"u"?i.exports=s():typeof define=="function"&&define.amd?define(s):(r=typeof globalThis<"u"?globalThis:r||self).dayjs_plugin_advancedFormat=s()})(e,function(){return function(r,s){var n=s.prototype,m=n.format;n.format=function(f){var w=this,Y=this.$locale();if(!this.isValid())return m.bind(this)(f);var M=this.$utils(),g=(f||"YYYY-MM-DDTHH:mm:ssZ").replace(/\[([^\]]+)]|Q|wo|ww|w|WW|W|zzz|z|gggg|GGGG|Do|X|x|k{1,2}|S/g,function(I){switch(I){case"Q":return Math.ceil((w.$M+1)/3);case"Do":return Y.ordinal(w.$D);case"gggg":return w.weekYear();case"GGGG":return w.isoWeekYear();case"wo":return Y.ordinal(w.week(),"W");case"w":case"ww":return M.s(w.week(),I==="w"?1:2,"0");case"W":case"WW":return M.s(w.isoWeek(),I==="W"?1:2,"0");case"k":case"kk":return M.s(String(w.$H===0?24:w.$H),I==="k"?1:2,"0");case"X":return Math.floor(w.$d.getTime()/1e3);case"x":return w.$d.getTime();case"z":return"["+w.offsetName()+"]";case"zzz":return"["+w.offsetName("long")+"]";default:return I}});return m.bind(this)(g)}}})}}),Se=function(){var e=l(function(_,c,u,h){for(u=u||{},h=_.length;h--;u[_[h]]=c);return u},"o"),i=[6,8,10,12,13,14,15,16,17,18,20,21,22,23,24,25,26,27,28,29,30,31,33,35,36,38,40],r=[1,26],s=[1,27],n=[1,28],m=[1,29],f=[1,30],w=[1,31],Y=[1,32],M=[1,33],g=[1,34],I=[1,9],O=[1,10],P=[1,11],j=[1,12],S=[1,13],p=[1,14],C=[1,15],L=[1,16],F=[1,19],q=[1,20],G=[1,21],Q=[1,22],H=[1,23],y=[1,25],b=[1,35],x={trace:l(function(){},"trace"),yy:{},symbols_:{error:2,start:3,gantt:4,document:5,EOF:6,line:7,SPACE:8,statement:9,NL:10,weekday:11,weekday_monday:12,weekday_tuesday:13,weekday_wednesday:14,weekday_thursday:15,weekday_friday:16,weekday_saturday:17,weekday_sunday:18,weekend:19,weekend_friday:20,weekend_saturday:21,dateFormat:22,inclusiveEndDates:23,topAxis:24,axisFormat:25,tickInterval:26,excludes:27,includes:28,todayMarker:29,title:30,acc_title:31,acc_title_value:32,acc_descr:33,acc_descr_value:34,acc_descr_multiline_value:35,section:36,clickStatement:37,taskTxt:38,taskData:39,click:40,callbackname:41,callbackargs:42,href:43,clickStatementDebug:44,$accept:0,$end:1},terminals_:{2:"error",4:"gantt",6:"EOF",8:"SPACE",10:"NL",12:"weekday_monday",13:"weekday_tuesday",14:"weekday_wednesday",15:"weekday_thursday",16:"weekday_friday",17:"weekday_saturday",18:"weekday_sunday",20:"weekend_friday",21:"weekend_saturday",22:"dateFormat",23:"inclusiveEndDates",24:"topAxis",25:"axisFormat",26:"tickInterval",27:"excludes",28:"includes",29:"todayMarker",30:"title",31:"acc_title",32:"acc_title_value",33:"acc_descr",34:"acc_descr_value",35:"acc_descr_multiline_value",36:"section",38:"taskTxt",39:"taskData",40:"click",41:"callbackname",42:"callbackargs",43:"href"},productions_:[0,[3,3],[5,0],[5,2],[7,2],[7,1],[7,1],[7,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[19,1],[19,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,2],[9,2],[9,1],[9,1],[9,1],[9,2],[37,2],[37,3],[37,3],[37,4],[37,3],[37,4],[37,2],[44,2],[44,3],[44,3],[44,4],[44,3],[44,4],[44,2]],performAction:l(function(c,u,h,d,v,a,o){var t=a.length-1;switch(v){case 1:return a[t-1];case 2:this.$=[];break;case 3:a[t-1].push(a[t]),this.$=a[t-1];break;case 4:case 5:this.$=a[t];break;case 6:case 7:this.$=[];break;case 8:d.setWeekday("monday");break;case 9:d.setWeekday("tuesday");break;case 10:d.setWeekday("wednesday");break;case 11:d.setWeekday("thursday");break;case 12:d.setWeekday("friday");break;case 13:d.setWeekday("saturday");break;case 14:d.setWeekday("sunday");break;case 15:d.setWeekend("friday");break;case 16:d.setWeekend("saturday");break;case 17:d.setDateFormat(a[t].substr(11)),this.$=a[t].substr(11);break;case 18:d.enableInclusiveEndDates(),this.$=a[t].substr(18);break;case 19:d.TopAxis(),this.$=a[t].substr(8);break;case 20:d.setAxisFormat(a[t].substr(11)),this.$=a[t].substr(11);break;case 21:d.setTickInterval(a[t].substr(13)),this.$=a[t].substr(13);break;case 22:d.setExcludes(a[t].substr(9)),this.$=a[t].substr(9);break;case 23:d.setIncludes(a[t].substr(9)),this.$=a[t].substr(9);break;case 24:d.setTodayMarker(a[t].substr(12)),this.$=a[t].substr(12);break;case 27:d.setDiagramTitle(a[t].substr(6)),this.$=a[t].substr(6);break;case 28:this.$=a[t].trim(),d.setAccTitle(this.$);break;case 29:case 30:this.$=a[t].trim(),d.setAccDescription(this.$);break;case 31:d.addSection(a[t].substr(8)),this.$=a[t].substr(8);break;case 33:d.addTask(a[t-1],a[t]),this.$="task";break;case 34:this.$=a[t-1],d.setClickEvent(a[t-1],a[t],null);break;case 35:this.$=a[t-2],d.setClickEvent(a[t-2],a[t-1],a[t]);break;case 36:this.$=a[t-2],d.setClickEvent(a[t-2],a[t-1],null),d.setLink(a[t-2],a[t]);break;case 37:this.$=a[t-3],d.setClickEvent(a[t-3],a[t-2],a[t-1]),d.setLink(a[t-3],a[t]);break;case 38:this.$=a[t-2],d.setClickEvent(a[t-2],a[t],null),d.setLink(a[t-2],a[t-1]);break;case 39:this.$=a[t-3],d.setClickEvent(a[t-3],a[t-1],a[t]),d.setLink(a[t-3],a[t-2]);break;case 40:this.$=a[t-1],d.setLink(a[t-1],a[t]);break;case 41:case 47:this.$=a[t-1]+" "+a[t];break;case 42:case 43:case 45:this.$=a[t-2]+" "+a[t-1]+" "+a[t];break;case 44:case 46:this.$=a[t-3]+" "+a[t-2]+" "+a[t-1]+" "+a[t];break}},"anonymous"),table:[{3:1,4:[1,2]},{1:[3]},e(i,[2,2],{5:3}),{6:[1,4],7:5,8:[1,6],9:7,10:[1,8],11:17,12:r,13:s,14:n,15:m,16:f,17:w,18:Y,19:18,20:M,21:g,22:I,23:O,24:P,25:j,26:S,27:p,28:C,29:L,30:F,31:q,33:G,35:Q,36:H,37:24,38:y,40:b},e(i,[2,7],{1:[2,1]}),e(i,[2,3]),{9:36,11:17,12:r,13:s,14:n,15:m,16:f,17:w,18:Y,19:18,20:M,21:g,22:I,23:O,24:P,25:j,26:S,27:p,28:C,29:L,30:F,31:q,33:G,35:Q,36:H,37:24,38:y,40:b},e(i,[2,5]),e(i,[2,6]),e(i,[2,17]),e(i,[2,18]),e(i,[2,19]),e(i,[2,20]),e(i,[2,21]),e(i,[2,22]),e(i,[2,23]),e(i,[2,24]),e(i,[2,25]),e(i,[2,26]),e(i,[2,27]),{32:[1,37]},{34:[1,38]},e(i,[2,30]),e(i,[2,31]),e(i,[2,32]),{39:[1,39]},e(i,[2,8]),e(i,[2,9]),e(i,[2,10]),e(i,[2,11]),e(i,[2,12]),e(i,[2,13]),e(i,[2,14]),e(i,[2,15]),e(i,[2,16]),{41:[1,40],43:[1,41]},e(i,[2,4]),e(i,[2,28]),e(i,[2,29]),e(i,[2,33]),e(i,[2,34],{42:[1,42],43:[1,43]}),e(i,[2,40],{41:[1,44]}),e(i,[2,35],{43:[1,45]}),e(i,[2,36]),e(i,[2,38],{42:[1,46]}),e(i,[2,37]),e(i,[2,39])],defaultActions:{},parseError:l(function(c,u){if(u.recoverable)this.trace(c);else{var h=new Error(c);throw h.hash=u,h}},"parseError"),parse:l(function(c){var u=this,h=[0],d=[],v=[null],a=[],o=this.table,t="",A=0,D=0,E=2,N=1,W=a.slice.call(arguments,1),V=Object.create(this.lexer),$={yy:{}};for(var ae in this.yy)Object.prototype.hasOwnProperty.call(this.yy,ae)&&($.yy[ae]=this.yy[ae]);V.setInput(c,$.yy),$.yy.lexer=V,$.yy.parser=this,typeof V.yylloc>"u"&&(V.yylloc={});var ne=V.yylloc;a.push(ne);var fe=V.options&&V.options.ranges;typeof $.yy.parseError=="function"?this.parseError=$.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function he(X){h.length=h.length-2*X,v.length=v.length-X,a.length=a.length-X}l(he,"popStack");function oe(){var X;return X=d.pop()||V.lex()||N,typeof X!="number"&&(X instanceof Array&&(d=X,X=d.pop()),X=u.symbols_[X]||X),X}l(oe,"lex");for(var z,U,B,ie,J={},re,K,Ne,ge;;){if(U=h[h.length-1],this.defaultActions[U]?B=this.defaultActions[U]:((z===null||typeof z>"u")&&(z=oe()),B=o[U]&&o[U][z]),typeof B>"u"||!B.length||!B[0]){var we="";ge=[];for(re in o[U])this.terminals_[re]&&re>E&&ge.push("'"+this.terminals_[re]+"'");V.showPosition?we="Parse error on line "+(A+1)+`:
`+V.showPosition()+`
Expecting `+ge.join(", ")+", got '"+(this.terminals_[z]||z)+"'":we="Parse error on line "+(A+1)+": Unexpected "+(z==N?"end of input":"'"+(this.terminals_[z]||z)+"'"),this.parseError(we,{text:V.match,token:this.terminals_[z]||z,line:V.yylineno,loc:ne,expected:ge})}if(B[0]instanceof Array&&B.length>1)throw new Error("Parse Error: multiple actions possible at state: "+U+", token: "+z);switch(B[0]){case 1:h.push(z),v.push(V.yytext),a.push(V.yylloc),h.push(B[1]),z=null,D=V.yyleng,t=V.yytext,A=V.yylineno,ne=V.yylloc;break;case 2:if(K=this.productions_[B[1]][1],J.$=v[v.length-K],J._$={first_line:a[a.length-(K||1)].first_line,last_line:a[a.length-1].last_line,first_column:a[a.length-(K||1)].first_column,last_column:a[a.length-1].last_column},fe&&(J._$.range=[a[a.length-(K||1)].range[0],a[a.length-1].range[1]]),ie=this.performAction.apply(J,[t,D,A,$.yy,B[1],v,a].concat(W)),typeof ie<"u")return ie;K&&(h=h.slice(0,-1*K*2),v=v.slice(0,-1*K),a=a.slice(0,-1*K)),h.push(this.productions_[B[1]][0]),v.push(J.$),a.push(J._$),Ne=o[h[h.length-2]][h[h.length-1]],h.push(Ne);break;case 3:return!0}}return!0},"parse")},T=function(){var _={EOF:1,parseError:l(function(u,h){if(this.yy.parser)this.yy.parser.parseError(u,h);else throw new Error(u)},"parseError"),setInput:l(function(c,u){return this.yy=u||this.yy||{},this._input=c,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:l(function(){var c=this._input[0];this.yytext+=c,this.yyleng++,this.offset++,this.match+=c,this.matched+=c;var u=c.match(/(?:\r\n?|\n).*/g);return u?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),c},"input"),unput:l(function(c){var u=c.length,h=c.split(/(?:\r\n?|\n)/g);this._input=c+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-u),this.offset-=u;var d=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),h.length-1&&(this.yylineno-=h.length-1);var v=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:h?(h.length===d.length?this.yylloc.first_column:0)+d[d.length-h.length].length-h[0].length:this.yylloc.first_column-u},this.options.ranges&&(this.yylloc.range=[v[0],v[0]+this.yyleng-u]),this.yyleng=this.yytext.length,this},"unput"),more:l(function(){return this._more=!0,this},"more"),reject:l(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:l(function(c){this.unput(this.match.slice(c))},"less"),pastInput:l(function(){var c=this.matched.substr(0,this.matched.length-this.match.length);return(c.length>20?"...":"")+c.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:l(function(){var c=this.match;return c.length<20&&(c+=this._input.substr(0,20-c.length)),(c.substr(0,20)+(c.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:l(function(){var c=this.pastInput(),u=new Array(c.length+1).join("-");return c+this.upcomingInput()+`
`+u+"^"},"showPosition"),test_match:l(function(c,u){var h,d,v;if(this.options.backtrack_lexer&&(v={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(v.yylloc.range=this.yylloc.range.slice(0))),d=c[0].match(/(?:\r\n?|\n).*/g),d&&(this.yylineno+=d.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:d?d[d.length-1].length-d[d.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+c[0].length},this.yytext+=c[0],this.match+=c[0],this.matches=c,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(c[0].length),this.matched+=c[0],h=this.performAction.call(this,this.yy,this,u,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),h)return h;if(this._backtrack){for(var a in v)this[a]=v[a];return!1}return!1},"test_match"),next:l(function(){if(this.done)return this.EOF;this._input||(this.done=!0);var c,u,h,d;this._more||(this.yytext="",this.match="");for(var v=this._currentRules(),a=0;a<v.length;a++)if(h=this._input.match(this.rules[v[a]]),h&&(!u||h[0].length>u[0].length)){if(u=h,d=a,this.options.backtrack_lexer){if(c=this.test_match(h,v[a]),c!==!1)return c;if(this._backtrack){u=!1;continue}else return!1}else if(!this.options.flex)break}return u?(c=this.test_match(u,v[d]),c!==!1?c:!1):this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:l(function(){var u=this.next();return u||this.lex()},"lex"),begin:l(function(u){this.conditionStack.push(u)},"begin"),popState:l(function(){var u=this.conditionStack.length-1;return u>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:l(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:l(function(u){return u=this.conditionStack.length-1-Math.abs(u||0),u>=0?this.conditionStack[u]:"INITIAL"},"topState"),pushState:l(function(u){this.begin(u)},"pushState"),stateStackSize:l(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:l(function(u,h,d,v){switch(d){case 0:return this.begin("open_directive"),"open_directive";case 1:return this.begin("acc_title"),31;case 2:return this.popState(),"acc_title_value";case 3:return this.begin("acc_descr"),33;case 4:return this.popState(),"acc_descr_value";case 5:this.begin("acc_descr_multiline");break;case 6:this.popState();break;case 7:return"acc_descr_multiline_value";case 8:break;case 9:break;case 10:break;case 11:return 10;case 12:break;case 13:break;case 14:this.begin("href");break;case 15:this.popState();break;case 16:return 43;case 17:this.begin("callbackname");break;case 18:this.popState();break;case 19:this.popState(),this.begin("callbackargs");break;case 20:return 41;case 21:this.popState();break;case 22:return 42;case 23:this.begin("click");break;case 24:this.popState();break;case 25:return 40;case 26:return 4;case 27:return 22;case 28:return 23;case 29:return 24;case 30:return 25;case 31:return 26;case 32:return 28;case 33:return 27;case 34:return 29;case 35:return 12;case 36:return 13;case 37:return 14;case 38:return 15;case 39:return 16;case 40:return 17;case 41:return 18;case 42:return 20;case 43:return 21;case 44:return"date";case 45:return 30;case 46:return"accDescription";case 47:return 36;case 48:return 38;case 49:return 39;case 50:return":";case 51:return 6;case 52:return"INVALID"}},"anonymous"),rules:[/^(?:%%\{)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:%%(?!\{)*[^\n]*)/i,/^(?:[^\}]%%*[^\n]*)/i,/^(?:%%*[^\n]*[\n]*)/i,/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:%[^\n]*)/i,/^(?:href[\s]+["])/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:call[\s]+)/i,/^(?:\([\s]*\))/i,/^(?:\()/i,/^(?:[^(]*)/i,/^(?:\))/i,/^(?:[^)]*)/i,/^(?:click[\s]+)/i,/^(?:[\s\n])/i,/^(?:[^\s\n]*)/i,/^(?:gantt\b)/i,/^(?:dateFormat\s[^#\n;]+)/i,/^(?:inclusiveEndDates\b)/i,/^(?:topAxis\b)/i,/^(?:axisFormat\s[^#\n;]+)/i,/^(?:tickInterval\s[^#\n;]+)/i,/^(?:includes\s[^#\n;]+)/i,/^(?:excludes\s[^#\n;]+)/i,/^(?:todayMarker\s[^\n;]+)/i,/^(?:weekday\s+monday\b)/i,/^(?:weekday\s+tuesday\b)/i,/^(?:weekday\s+wednesday\b)/i,/^(?:weekday\s+thursday\b)/i,/^(?:weekday\s+friday\b)/i,/^(?:weekday\s+saturday\b)/i,/^(?:weekday\s+sunday\b)/i,/^(?:weekend\s+friday\b)/i,/^(?:weekend\s+saturday\b)/i,/^(?:\d\d\d\d-\d\d-\d\d\b)/i,/^(?:title\s[^\n]+)/i,/^(?:accDescription\s[^#\n;]+)/i,/^(?:section\s[^\n]+)/i,/^(?:[^:\n]+)/i,/^(?::[^#\n;]+)/i,/^(?::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{acc_descr_multiline:{rules:[6,7],inclusive:!1},acc_descr:{rules:[4],inclusive:!1},acc_title:{rules:[2],inclusive:!1},callbackargs:{rules:[21,22],inclusive:!1},callbackname:{rules:[18,19,20],inclusive:!1},href:{rules:[15,16],inclusive:!1},click:{rules:[24,25],inclusive:!1},INITIAL:{rules:[0,1,3,5,8,9,10,11,12,13,14,17,23,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52],inclusive:!0}}};return _}();x.lexer=T;function k(){this.yy={}}return l(k,"Parser"),k.prototype=x,x.Parser=k,new k}();Se.parser=Se;var Wt=Se,Vt=de(It()),Z=de(Je()),Ot=de(Lt()),Pt=de(Ft()),zt=de(Yt());Z.default.extend(Ot.default);Z.default.extend(Pt.default);Z.default.extend(zt.default);var Ze={friday:5,saturday:6},ee="",Ae="",Le=void 0,Fe="",ke=[],me=[],Ye=new Map,We=[],xe=[],ue="",Ve="",Ke=["active","done","crit","milestone","vert"],Oe=[],ye=!1,Pe=!1,ze="sunday",_e="saturday",Ce=0,Rt=l(function(){We=[],xe=[],ue="",Oe=[],ve=0,Me=void 0,Te=void 0,R=[],ee="",Ae="",Ve="",Le=void 0,Fe="",ke=[],me=[],ye=!1,Pe=!1,Ce=0,Ye=new Map,Mt(),ze="sunday",_e="saturday"},"clear"),Nt=l(function(e){Ae=e},"setAxisFormat"),jt=l(function(){return Ae},"getAxisFormat"),Bt=l(function(e){Le=e},"setTickInterval"),qt=l(function(){return Le},"getTickInterval"),Gt=l(function(e){Fe=e},"setTodayMarker"),Ht=l(function(){return Fe},"getTodayMarker"),Xt=l(function(e){ee=e},"setDateFormat"),Ut=l(function(){ye=!0},"enableInclusiveEndDates"),Zt=l(function(){return ye},"endDatesAreInclusive"),Qt=l(function(){Pe=!0},"enableTopAxis"),$t=l(function(){return Pe},"topAxisEnabled"),Jt=l(function(e){Ve=e},"setDisplayMode"),Kt=l(function(){return Ve},"getDisplayMode"),er=l(function(){return ee},"getDateFormat"),tr=l(function(e){ke=e.toLowerCase().split(/[\s,]+/)},"setIncludes"),rr=l(function(){return ke},"getIncludes"),ir=l(function(e){me=e.toLowerCase().split(/[\s,]+/)},"setExcludes"),sr=l(function(){return me},"getExcludes"),ar=l(function(){return Ye},"getLinks"),nr=l(function(e){ue=e,We.push(e)},"addSection"),or=l(function(){return We},"getSections"),cr=l(function(){let e=Qe();const i=10;let r=0;for(;!e&&r<i;)e=Qe(),r++;return xe=R,xe},"getTasks"),et=l(function(e,i,r,s){return s.includes(e.format(i.trim()))?!1:r.includes("weekends")&&(e.isoWeekday()===Ze[_e]||e.isoWeekday()===Ze[_e]+1)||r.includes(e.format("dddd").toLowerCase())?!0:r.includes(e.format(i.trim()))},"isInvalidDate"),lr=l(function(e){ze=e},"setWeekday"),ur=l(function(){return ze},"getWeekday"),dr=l(function(e){_e=e},"setWeekend"),tt=l(function(e,i,r,s){if(!r.length||e.manualEndTime)return;let n;e.startTime instanceof Date?n=(0,Z.default)(e.startTime):n=(0,Z.default)(e.startTime,i,!0),n=n.add(1,"d");let m;e.endTime instanceof Date?m=(0,Z.default)(e.endTime):m=(0,Z.default)(e.endTime,i,!0);const[f,w]=fr(n,m,i,r,s);e.endTime=f.toDate(),e.renderEndTime=w},"checkTaskDates"),fr=l(function(e,i,r,s,n){let m=!1,f=null;for(;e<=i;)m||(f=i.toDate()),m=et(e,r,s,n),m&&(i=i.add(1,"d")),e=e.add(1,"d");return[i,f]},"fixTaskDates"),Ee=l(function(e,i,r){r=r.trim();const n=/^after\s+(?<ids>[\d\w- ]+)/.exec(r);if(n!==null){let f=null;for(const Y of n.groups.ids.split(" ")){let M=se(Y);M!==void 0&&(!f||M.endTime>f.endTime)&&(f=M)}if(f)return f.endTime;const w=new Date;return w.setHours(0,0,0,0),w}let m=(0,Z.default)(r,i.trim(),!0);if(m.isValid())return m.toDate();{be.debug("Invalid date:"+r),be.debug("With date format:"+i.trim());const f=new Date(r);if(f===void 0||isNaN(f.getTime())||f.getFullYear()<-1e4||f.getFullYear()>1e4)throw new Error("Invalid date:"+r);return f}},"getStartDate"),rt=l(function(e){const i=/^(\d+(?:\.\d+)?)([Mdhmswy]|ms)$/.exec(e.trim());return i!==null?[Number.parseFloat(i[1]),i[2]]:[NaN,"ms"]},"parseDuration"),it=l(function(e,i,r,s=!1){r=r.trim();const m=/^until\s+(?<ids>[\d\w- ]+)/.exec(r);if(m!==null){let g=null;for(const O of m.groups.ids.split(" ")){let P=se(O);P!==void 0&&(!g||P.startTime<g.startTime)&&(g=P)}if(g)return g.startTime;const I=new Date;return I.setHours(0,0,0,0),I}let f=(0,Z.default)(r,i.trim(),!0);if(f.isValid())return s&&(f=f.add(1,"d")),f.toDate();let w=(0,Z.default)(e);const[Y,M]=rt(r);if(!Number.isNaN(Y)){const g=w.add(Y,M);g.isValid()&&(w=g)}return w.toDate()},"getEndDate"),ve=0,le=l(function(e){return e===void 0?(ve=ve+1,"task"+ve):e},"parseId"),hr=l(function(e,i){let r;i.substr(0,1)===":"?r=i.substr(1,i.length):r=i;const s=r.split(","),n={};Re(s,n,Ke);for(let f=0;f<s.length;f++)s[f]=s[f].trim();let m="";switch(s.length){case 1:n.id=le(),n.startTime=e.endTime,m=s[0];break;case 2:n.id=le(),n.startTime=Ee(void 0,ee,s[0]),m=s[1];break;case 3:n.id=le(s[0]),n.startTime=Ee(void 0,ee,s[1]),m=s[2];break}return m&&(n.endTime=it(n.startTime,ee,m,ye),n.manualEndTime=(0,Z.default)(m,"YYYY-MM-DD",!0).isValid(),tt(n,ee,me,ke)),n},"compileData"),kr=l(function(e,i){let r;i.substr(0,1)===":"?r=i.substr(1,i.length):r=i;const s=r.split(","),n={};Re(s,n,Ke);for(let m=0;m<s.length;m++)s[m]=s[m].trim();switch(s.length){case 1:n.id=le(),n.startTime={type:"prevTaskEnd",id:e},n.endTime={data:s[0]};break;case 2:n.id=le(),n.startTime={type:"getStartDate",startData:s[0]},n.endTime={data:s[1]};break;case 3:n.id=le(s[0]),n.startTime={type:"getStartDate",startData:s[1]},n.endTime={data:s[2]};break}return n},"parseData"),Me,Te,R=[],st={},mr=l(function(e,i){const r={section:ue,type:ue,processed:!1,manualEndTime:!1,renderEndTime:null,raw:{data:i},task:e,classes:[]},s=kr(Te,i);r.raw.startTime=s.startTime,r.raw.endTime=s.endTime,r.id=s.id,r.prevTaskId=Te,r.active=s.active,r.done=s.done,r.crit=s.crit,r.milestone=s.milestone,r.vert=s.vert,r.order=Ce,Ce++;const n=R.push(r);Te=r.id,st[r.id]=n-1},"addTask"),se=l(function(e){const i=st[e];return R[i]},"findTaskById"),yr=l(function(e,i){const r={section:ue,type:ue,description:e,task:e,classes:[]},s=hr(Me,i);r.startTime=s.startTime,r.endTime=s.endTime,r.id=s.id,r.active=s.active,r.done=s.done,r.crit=s.crit,r.milestone=s.milestone,r.vert=s.vert,Me=r,xe.push(r)},"addTaskOrg"),Qe=l(function(){const e=l(function(r){const s=R[r];let n="";switch(R[r].raw.startTime.type){case"prevTaskEnd":{const m=se(s.prevTaskId);s.startTime=m.endTime;break}case"getStartDate":n=Ee(void 0,ee,R[r].raw.startTime.startData),n&&(R[r].startTime=n);break}return R[r].startTime&&(R[r].endTime=it(R[r].startTime,ee,R[r].raw.endTime.data,ye),R[r].endTime&&(R[r].processed=!0,R[r].manualEndTime=(0,Z.default)(R[r].raw.endTime.data,"YYYY-MM-DD",!0).isValid(),tt(R[r],ee,me,ke))),R[r].processed},"compileTask");let i=!0;for(const[r,s]of R.entries())e(r),i=i&&s.processed;return i},"compileTasks"),gr=l(function(e,i){let r=i;ce().securityLevel!=="loose"&&(r=(0,Vt.sanitizeUrl)(i)),e.split(",").forEach(function(s){se(s)!==void 0&&(nt(s,()=>{window.open(r,"_self")}),Ye.set(s,r))}),at(e,"clickable")},"setLink"),at=l(function(e,i){e.split(",").forEach(function(r){let s=se(r);s!==void 0&&s.classes.push(i)})},"setClass"),pr=l(function(e,i,r){if(ce().securityLevel!=="loose"||i===void 0)return;let s=[];if(typeof r=="string"){s=r.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);for(let m=0;m<s.length;m++){let f=s[m].trim();f.startsWith('"')&&f.endsWith('"')&&(f=f.substr(1,f.length-2)),s[m]=f}}s.length===0&&s.push(e),se(e)!==void 0&&nt(e,()=>{At.runFunc(i,...s)})},"setClickFun"),nt=l(function(e,i){Oe.push(function(){const r=document.querySelector(`[id="${e}"]`);r!==null&&r.addEventListener("click",function(){i()})},function(){const r=document.querySelector(`[id="${e}-text"]`);r!==null&&r.addEventListener("click",function(){i()})})},"pushFun"),vr=l(function(e,i,r){e.split(",").forEach(function(s){pr(s,i,r)}),at(e,"clickable")},"setClickEvent"),Tr=l(function(e){Oe.forEach(function(i){i(e)})},"bindFunctions"),br={getConfig:l(()=>ce().gantt,"getConfig"),clear:Rt,setDateFormat:Xt,getDateFormat:er,enableInclusiveEndDates:Ut,endDatesAreInclusive:Zt,enableTopAxis:Qt,topAxisEnabled:$t,setAxisFormat:Nt,getAxisFormat:jt,setTickInterval:Bt,getTickInterval:qt,setTodayMarker:Gt,getTodayMarker:Ht,setAccTitle:ft,getAccTitle:dt,setDiagramTitle:ut,getDiagramTitle:lt,setDisplayMode:Jt,getDisplayMode:Kt,setAccDescription:ct,getAccDescription:ot,addSection:nr,getSections:or,getTasks:cr,addTask:mr,findTaskById:se,addTaskOrg:yr,setIncludes:tr,getIncludes:rr,setExcludes:ir,getExcludes:sr,setClickEvent:vr,setLink:gr,getLinks:ar,bindFunctions:Tr,parseDuration:rt,isInvalidDate:et,setWeekday:lr,getWeekday:ur,setWeekend:dr};function Re(e,i,r){let s=!0;for(;s;)s=!1,r.forEach(function(n){const m="^\\s*"+n+"\\s*$",f=new RegExp(m);e[0].match(f)&&(i[n]=!0,e.shift(1),s=!0)})}l(Re,"getTaskTags");var De=de(Je()),xr=l(function(){be.debug("Something is calling, setConf, remove the call")},"setConf"),$e={monday:St,tuesday:Dt,wednesday:wt,thursday:_t,friday:xt,saturday:bt,sunday:Tt},_r=l((e,i)=>{let r=[...e].map(()=>-1/0),s=[...e].sort((m,f)=>m.startTime-f.startTime||m.order-f.order),n=0;for(const m of s)for(let f=0;f<r.length;f++)if(m.startTime>=r[f]){r[f]=m.endTime,m.order=f+i,f>n&&(n=f);break}return n},"getMaxIntersections"),te,wr=l(function(e,i,r,s){const n=ce().gantt,m=ce().securityLevel;let f;m==="sandbox"&&(f=pe("#i"+i));const w=m==="sandbox"?pe(f.nodes()[0].contentDocument.body):pe("body"),Y=m==="sandbox"?f.nodes()[0].contentDocument:document,M=Y.getElementById(i);te=M.parentElement.offsetWidth,te===void 0&&(te=1200),n.useWidth!==void 0&&(te=n.useWidth);const g=s.db.getTasks();let I=[];for(const y of g)I.push(y.type);I=H(I);const O={};let P=2*n.topPadding;if(s.db.getDisplayMode()==="compact"||n.displayMode==="compact"){const y={};for(const x of g)y[x.section]===void 0?y[x.section]=[x]:y[x.section].push(x);let b=0;for(const x of Object.keys(y)){const T=_r(y[x],b)+1;b+=T,P+=T*(n.barHeight+n.barGap),O[x]=T}}else{P+=g.length*(n.barHeight+n.barGap);for(const y of I)O[y]=g.filter(b=>b.type===y).length}M.setAttribute("viewBox","0 0 "+te+" "+P);const j=w.select(`[id="${i}"]`),S=ht().domain([kt(g,function(y){return y.startTime}),mt(g,function(y){return y.endTime})]).rangeRound([0,te-n.leftPadding-n.rightPadding]);function p(y,b){const x=y.startTime,T=b.startTime;let k=0;return x>T?k=1:x<T&&(k=-1),k}l(p,"taskCompare"),g.sort(p),C(g,te,P),yt(j,P,te,n.useMaxWidth),j.append("text").text(s.db.getDiagramTitle()).attr("x",te/2).attr("y",n.titleTopMargin).attr("class","titleText");function C(y,b,x){const T=n.barHeight,k=T+n.barGap,_=n.topPadding,c=n.leftPadding,u=gt().domain([0,I.length]).range(["#00B9FA","#F95002"]).interpolate(pt);F(k,_,c,b,x,y,s.db.getExcludes(),s.db.getIncludes()),q(c,_,b,x),L(y,k,_,c,T,u,b),G(k,_),Q(c,_,b,x)}l(C,"makeGantt");function L(y,b,x,T,k,_,c){y.sort((o,t)=>o.vert===t.vert?0:o.vert?1:-1);const h=[...new Set(y.map(o=>o.order))].map(o=>y.find(t=>t.order===o));j.append("g").selectAll("rect").data(h).enter().append("rect").attr("x",0).attr("y",function(o,t){return t=o.order,t*b+x-2}).attr("width",function(){return c-n.rightPadding/2}).attr("height",b).attr("class",function(o){for(const[t,A]of I.entries())if(o.type===A)return"section section"+t%n.numberSectionStyles;return"section section0"}).enter();const d=j.append("g").selectAll("rect").data(y).enter(),v=s.db.getLinks();if(d.append("rect").attr("id",function(o){return o.id}).attr("rx",3).attr("ry",3).attr("x",function(o){return o.milestone?S(o.startTime)+T+.5*(S(o.endTime)-S(o.startTime))-.5*k:S(o.startTime)+T}).attr("y",function(o,t){return t=o.order,o.vert?n.gridLineStartPadding:t*b+x}).attr("width",function(o){return o.milestone?k:o.vert?.08*k:S(o.renderEndTime||o.endTime)-S(o.startTime)}).attr("height",function(o){return o.vert?g.length*(n.barHeight+n.barGap)+n.barHeight*2:k}).attr("transform-origin",function(o,t){return t=o.order,(S(o.startTime)+T+.5*(S(o.endTime)-S(o.startTime))).toString()+"px "+(t*b+x+.5*k).toString()+"px"}).attr("class",function(o){const t="task";let A="";o.classes.length>0&&(A=o.classes.join(" "));let D=0;for(const[N,W]of I.entries())o.type===W&&(D=N%n.numberSectionStyles);let E="";return o.active?o.crit?E+=" activeCrit":E=" active":o.done?o.crit?E=" doneCrit":E=" done":o.crit&&(E+=" crit"),E.length===0&&(E=" task"),o.milestone&&(E=" milestone "+E),o.vert&&(E=" vert "+E),E+=D,E+=" "+A,t+E}),d.append("text").attr("id",function(o){return o.id+"-text"}).text(function(o){return o.task}).attr("font-size",n.fontSize).attr("x",function(o){let t=S(o.startTime),A=S(o.renderEndTime||o.endTime);if(o.milestone&&(t+=.5*(S(o.endTime)-S(o.startTime))-.5*k,A=t+k),o.vert)return S(o.startTime)+T;const D=this.getBBox().width;return D>A-t?A+D+1.5*n.leftPadding>c?t+T-5:A+T+5:(A-t)/2+t+T}).attr("y",function(o,t){return o.vert?n.gridLineStartPadding+g.length*(n.barHeight+n.barGap)+60:(t=o.order,t*b+n.barHeight/2+(n.fontSize/2-2)+x)}).attr("text-height",k).attr("class",function(o){const t=S(o.startTime);let A=S(o.endTime);o.milestone&&(A=t+k);const D=this.getBBox().width;let E="";o.classes.length>0&&(E=o.classes.join(" "));let N=0;for(const[V,$]of I.entries())o.type===$&&(N=V%n.numberSectionStyles);let W="";return o.active&&(o.crit?W="activeCritText"+N:W="activeText"+N),o.done?o.crit?W=W+" doneCritText"+N:W=W+" doneText"+N:o.crit&&(W=W+" critText"+N),o.milestone&&(W+=" milestoneText"),o.vert&&(W+=" vertText"),D>A-t?A+D+1.5*n.leftPadding>c?E+" taskTextOutsideLeft taskTextOutside"+N+" "+W:E+" taskTextOutsideRight taskTextOutside"+N+" "+W+" width-"+D:E+" taskText taskText"+N+" "+W+" width-"+D}),ce().securityLevel==="sandbox"){let o;o=pe("#i"+i);const t=o.nodes()[0].contentDocument;d.filter(function(A){return v.has(A.id)}).each(function(A){var D=t.querySelector("#"+A.id),E=t.querySelector("#"+A.id+"-text");const N=D.parentNode;var W=t.createElement("a");W.setAttribute("xlink:href",v.get(A.id)),W.setAttribute("target","_top"),N.appendChild(W),W.appendChild(D),W.appendChild(E)})}}l(L,"drawRects");function F(y,b,x,T,k,_,c,u){if(c.length===0&&u.length===0)return;let h,d;for(const{startTime:D,endTime:E}of _)(h===void 0||D<h)&&(h=D),(d===void 0||E>d)&&(d=E);if(!h||!d)return;if((0,De.default)(d).diff((0,De.default)(h),"year")>5){be.warn("The difference between the min and max time is more than 5 years. This will cause performance issues. Skipping drawing exclude days.");return}const v=s.db.getDateFormat(),a=[];let o=null,t=(0,De.default)(h);for(;t.valueOf()<=d;)s.db.isInvalidDate(t,v,c,u)?o?o.end=t:o={start:t,end:t}:o&&(a.push(o),o=null),t=t.add(1,"d");j.append("g").selectAll("rect").data(a).enter().append("rect").attr("id",function(D){return"exclude-"+D.start.format("YYYY-MM-DD")}).attr("x",function(D){return S(D.start)+x}).attr("y",n.gridLineStartPadding).attr("width",function(D){const E=D.end.add(1,"day");return S(E)-S(D.start)}).attr("height",k-b-n.gridLineStartPadding).attr("transform-origin",function(D,E){return(S(D.start)+x+.5*(S(D.end)-S(D.start))).toString()+"px "+(E*y+.5*k).toString()+"px"}).attr("class","exclude-range")}l(F,"drawExcludeDays");function q(y,b,x,T){let k=vt(S).tickSize(-T+b+n.gridLineStartPadding).tickFormat(je(s.db.getAxisFormat()||n.axisFormat||"%Y-%m-%d"));const c=/^([1-9]\d*)(millisecond|second|minute|hour|day|week|month)$/.exec(s.db.getTickInterval()||n.tickInterval);if(c!==null){const u=c[1],h=c[2],d=s.db.getWeekday()||n.weekday;switch(h){case"millisecond":k.ticks(Ue.every(u));break;case"second":k.ticks(Xe.every(u));break;case"minute":k.ticks(He.every(u));break;case"hour":k.ticks(Ge.every(u));break;case"day":k.ticks(qe.every(u));break;case"week":k.ticks($e[d].every(u));break;case"month":k.ticks(Be.every(u));break}}if(j.append("g").attr("class","grid").attr("transform","translate("+y+", "+(T-50)+")").call(k).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10).attr("dy","1em"),s.db.topAxisEnabled()||n.topAxis){let u=Ct(S).tickSize(-T+b+n.gridLineStartPadding).tickFormat(je(s.db.getAxisFormat()||n.axisFormat||"%Y-%m-%d"));if(c!==null){const h=c[1],d=c[2],v=s.db.getWeekday()||n.weekday;switch(d){case"millisecond":u.ticks(Ue.every(h));break;case"second":u.ticks(Xe.every(h));break;case"minute":u.ticks(He.every(h));break;case"hour":u.ticks(Ge.every(h));break;case"day":u.ticks(qe.every(h));break;case"week":u.ticks($e[v].every(h));break;case"month":u.ticks(Be.every(h));break}}j.append("g").attr("class","grid").attr("transform","translate("+y+", "+b+")").call(u).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10)}}l(q,"makeGrid");function G(y,b){let x=0;const T=Object.keys(O).map(k=>[k,O[k]]);j.append("g").selectAll("text").data(T).enter().append(function(k){const _=k[0].split(Et.lineBreakRegex),c=-(_.length-1)/2,u=Y.createElementNS("http://www.w3.org/2000/svg","text");u.setAttribute("dy",c+"em");for(const[h,d]of _.entries()){const v=Y.createElementNS("http://www.w3.org/2000/svg","tspan");v.setAttribute("alignment-baseline","central"),v.setAttribute("x","10"),h>0&&v.setAttribute("dy","1em"),v.textContent=d,u.appendChild(v)}return u}).attr("x",10).attr("y",function(k,_){if(_>0)for(let c=0;c<_;c++)return x+=T[_-1][1],k[1]*y/2+x*y+b;else return k[1]*y/2+b}).attr("font-size",n.sectionFontSize).attr("class",function(k){for(const[_,c]of I.entries())if(k[0]===c)return"sectionTitle sectionTitle"+_%n.numberSectionStyles;return"sectionTitle"})}l(G,"vertLabels");function Q(y,b,x,T){const k=s.db.getTodayMarker();if(k==="off")return;const _=j.append("g").attr("class","today"),c=new Date,u=_.append("line");u.attr("x1",S(c)+y).attr("x2",S(c)+y).attr("y1",n.titleTopMargin).attr("y2",T-n.titleTopMargin).attr("class","today"),k!==""&&u.attr("style",k.replace(/,/g,";"))}l(Q,"drawToday");function H(y){const b={},x=[];for(let T=0,k=y.length;T<k;++T)Object.prototype.hasOwnProperty.call(b,y[T])||(b[y[T]]=!0,x.push(y[T]));return x}l(H,"checkUnique")},"draw"),Dr={setConf:xr,draw:wr},Sr=l(e=>`
  .mermaid-main-font {
        font-family: ${e.fontFamily};
  }

  .exclude-range {
    fill: ${e.excludeBkgColor};
  }

  .section {
    stroke: none;
    opacity: 0.2;
  }

  .section0 {
    fill: ${e.sectionBkgColor};
  }

  .section2 {
    fill: ${e.sectionBkgColor2};
  }

  .section1,
  .section3 {
    fill: ${e.altSectionBkgColor};
    opacity: 0.2;
  }

  .sectionTitle0 {
    fill: ${e.titleColor};
  }

  .sectionTitle1 {
    fill: ${e.titleColor};
  }

  .sectionTitle2 {
    fill: ${e.titleColor};
  }

  .sectionTitle3 {
    fill: ${e.titleColor};
  }

  .sectionTitle {
    text-anchor: start;
    font-family: ${e.fontFamily};
  }


  /* Grid and axis */

  .grid .tick {
    stroke: ${e.gridColor};
    opacity: 0.8;
    shape-rendering: crispEdges;
  }

  .grid .tick text {
    font-family: ${e.fontFamily};
    fill: ${e.textColor};
  }

  .grid path {
    stroke-width: 0;
  }


  /* Today line */

  .today {
    fill: none;
    stroke: ${e.todayLineColor};
    stroke-width: 2px;
  }


  /* Task styling */

  /* Default task */

  .task {
    stroke-width: 2;
  }

  .taskText {
    text-anchor: middle;
    font-family: ${e.fontFamily};
  }

  .taskTextOutsideRight {
    fill: ${e.taskTextDarkColor};
    text-anchor: start;
    font-family: ${e.fontFamily};
  }

  .taskTextOutsideLeft {
    fill: ${e.taskTextDarkColor};
    text-anchor: end;
  }


  /* Special case clickable */

  .task.clickable {
    cursor: pointer;
  }

  .taskText.clickable {
    cursor: pointer;
    fill: ${e.taskTextClickableColor} !important;
    font-weight: bold;
  }

  .taskTextOutsideLeft.clickable {
    cursor: pointer;
    fill: ${e.taskTextClickableColor} !important;
    font-weight: bold;
  }

  .taskTextOutsideRight.clickable {
    cursor: pointer;
    fill: ${e.taskTextClickableColor} !important;
    font-weight: bold;
  }


  /* Specific task settings for the sections*/

  .taskText0,
  .taskText1,
  .taskText2,
  .taskText3 {
    fill: ${e.taskTextColor};
  }

  .task0,
  .task1,
  .task2,
  .task3 {
    fill: ${e.taskBkgColor};
    stroke: ${e.taskBorderColor};
  }

  .taskTextOutside0,
  .taskTextOutside2
  {
    fill: ${e.taskTextOutsideColor};
  }

  .taskTextOutside1,
  .taskTextOutside3 {
    fill: ${e.taskTextOutsideColor};
  }


  /* Active task */

  .active0,
  .active1,
  .active2,
  .active3 {
    fill: ${e.activeTaskBkgColor};
    stroke: ${e.activeTaskBorderColor};
  }

  .activeText0,
  .activeText1,
  .activeText2,
  .activeText3 {
    fill: ${e.taskTextDarkColor} !important;
  }


  /* Completed task */

  .done0,
  .done1,
  .done2,
  .done3 {
    stroke: ${e.doneTaskBorderColor};
    fill: ${e.doneTaskBkgColor};
    stroke-width: 2;
  }

  .doneText0,
  .doneText1,
  .doneText2,
  .doneText3 {
    fill: ${e.taskTextDarkColor} !important;
  }


  /* Tasks on the critical line */

  .crit0,
  .crit1,
  .crit2,
  .crit3 {
    stroke: ${e.critBorderColor};
    fill: ${e.critBkgColor};
    stroke-width: 2;
  }

  .activeCrit0,
  .activeCrit1,
  .activeCrit2,
  .activeCrit3 {
    stroke: ${e.critBorderColor};
    fill: ${e.activeTaskBkgColor};
    stroke-width: 2;
  }

  .doneCrit0,
  .doneCrit1,
  .doneCrit2,
  .doneCrit3 {
    stroke: ${e.critBorderColor};
    fill: ${e.doneTaskBkgColor};
    stroke-width: 2;
    cursor: pointer;
    shape-rendering: crispEdges;
  }

  .milestone {
    transform: rotate(45deg) scale(0.8,0.8);
  }

  .milestoneText {
    font-style: italic;
  }
  .doneCritText0,
  .doneCritText1,
  .doneCritText2,
  .doneCritText3 {
    fill: ${e.taskTextDarkColor} !important;
  }

  .vert {
    stroke: ${e.vertLineColor};
  }

  .vertText {
    font-size: 15px;
    text-anchor: middle;
    fill: ${e.vertLineColor} !important;
  }

  .activeCritText0,
  .activeCritText1,
  .activeCritText2,
  .activeCritText3 {
    fill: ${e.taskTextDarkColor} !important;
  }

  .titleText {
    text-anchor: middle;
    font-size: 18px;
    fill: ${e.titleColor||e.textColor};
    font-family: ${e.fontFamily};
  }
`,"getStyles"),Cr=Sr,Fr={parser:Wt,db:br,renderer:Dr,styles:Cr};export{Fr as diagram};
