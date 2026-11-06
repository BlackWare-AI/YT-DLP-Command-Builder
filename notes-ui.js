'use strict';
// The native textarea still handles editing, selection, IME and clipboard operations.
// Dashes are painted above empty group-gap lines, never inserted into its text.
window.NotesUI={attach(editor) {
  const layer=document.createElement('div');
  layer.className='notes-separator-layer';layer.setAttribute('aria-hidden','true');
  editor.after(layer);
  let frame=0,positions=[],measuredKey=null;
  function scroll() {
    for(let i=0;i<layer.children.length;i++)
      layer.children[i].style.transform='translateY('+(positions[i]-editor.scrollTop)+'px)';
  }
  function measure() {
    frame=0;
    if(!editor.closest('dialog').open || !editor.clientWidth) {measuredKey=null;return;}
    const style=getComputedStyle(editor);
    const key=JSON.stringify([editor.value,editor.clientWidth,style.font,style.padding,style.letterSpacing]);
    if(key===measuredKey) {scroll();return;}
    measuredKey=key;layer.textContent='';positions=[];
    const groups=Builder.noteSeparatorGroups(editor.value);
    if(!groups.length) return;
    const mirror=document.createElement('div');
    Object.assign(mirror.style,{position:'fixed',left:'-10000px',top:'0',visibility:'hidden',
      boxSizing:'border-box',width:editor.clientWidth+'px',whiteSpace:'pre-wrap',overflowWrap:'break-word',
      font:style.font,lineHeight:style.lineHeight,letterSpacing:style.letterSpacing,
      wordSpacing:style.wordSpacing,tabSize:style.tabSize,padding:style.padding,border:'0'});
    let previous=0;const markers=[];
    for(const group of groups) {
      mirror.append(document.createTextNode(editor.value.slice(previous,offset)));
      const marker=document.createElement('span');marker.textContent='\u200b';mirror.append(marker);markers.push({marker,count:group.count});
      previous=group.offset;
    }
    mirror.append(document.createTextNode(editor.value.slice(previous)));document.body.append(mirror);
    const top=mirror.getBoundingClientRect().top;
    positions=markers.map(item=>item.marker.getBoundingClientRect().top-top);
    mirror.remove();
    for(let i=0;i<positions.length;i++) {
      const divider=document.createElement('div');divider.className='notes-group-divider';
      divider.textContent='- '.repeat(256);
      Object.assign(divider.style,{left:style.paddingLeft,right:style.paddingRight,height:style.lineHeight,
        lineHeight:style.lineHeight,font:style.font});
      const count=document.createElement('span');count.className='notes-group-count';
      count.textContent=document.documentElement.lang==='en'
        ? markers[i].count+' '+(markers[i].count===1?'link':'links')
        : markers[i].count+' bağlantı';
      divider.append(count);layer.append(divider);
    }
    scroll();
  }
  function render() {if(!frame) frame=requestAnimationFrame(measure);}
  editor.addEventListener('scroll',scroll,{passive:true});
  if(typeof ResizeObserver==='function') new ResizeObserver(render).observe(editor);
  else window.addEventListener('resize',render,{passive:true});
  return {render};
}};
