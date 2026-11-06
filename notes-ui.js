'use strict';
// The native textarea still handles editing, selection, IME and clipboard operations.
// Dividers and inline tag chips are painted in a separate, non-interactive visual layer.
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
    const style=getComputedStyle(editor),value=editor.value;
    const key=JSON.stringify([value,editor.clientWidth,style.font,style.padding,style.letterSpacing]);
    if(key===measuredKey) {scroll();return;}
    measuredKey=key;layer.textContent='';positions=[];
    const groups=Builder.noteSeparatorGroups(value);
    const tags=Builder.noteVisualTags(value);
    if(!groups.length && !tags.length) return;
    const mirror=document.createElement('div');
    Object.assign(mirror.style,{position:'fixed',left:'-10000px',top:'0',visibility:'hidden',
      boxSizing:'border-box',width:editor.clientWidth+'px',whiteSpace:'pre-wrap',overflowWrap:'break-word',
      font:style.font,lineHeight:style.lineHeight,letterSpacing:style.letterSpacing,
      wordSpacing:style.wordSpacing,tabSize:style.tabSize,padding:style.padding,border:'0'});
    const operations=tags.map(tag=>({kind:'tag',offset:tag.start,end:tag.end,text:tag.text}))
      .concat(groups.map(group=>({kind:'divider',offset:group.offset,afterEnd:group.afterEnd,count:group.count})))
      .sort((a,b)=>a.offset-b.offset || (a.kind==='tag'?-1:1));
    let previous=0;const markers=[],tagMarkers=[];
    for(const operation of operations) {
      mirror.append(document.createTextNode(value.slice(previous,operation.offset)));
      if(operation.kind==='tag') {
        const marker=document.createElement('span');
        marker.textContent=operation.text;
        Object.assign(marker.style,{font:style.font,letterSpacing:style.letterSpacing,wordSpacing:style.wordSpacing});
        mirror.append(marker);tagMarkers.push({marker,text:operation.text});previous=operation.end;
      } else {
        if(operation.afterEnd && !/[\r\n]$/.test(value)) mirror.append(document.createTextNode('\n'));
        const marker=document.createElement('span');marker.textContent='\u200b';mirror.append(marker);
        markers.push({marker,count:operation.count});previous=operation.offset;
      }
    }
    mirror.append(document.createTextNode(value.slice(previous)));document.body.append(mirror);
    const mirrorRect=mirror.getBoundingClientRect();
    const measuredTags=tagMarkers.map(item=>({text:item.text,rect:item.marker.getBoundingClientRect()}));
    const measuredDividers=markers.map(item=>({count:item.count,top:item.marker.getBoundingClientRect().top-mirrorRect.top}));
    mirror.remove();
    const borderLeft=parseFloat(style.borderLeftWidth)||0,borderTop=parseFloat(style.borderTopWidth)||0;
    for(const item of measuredTags) {
      const chip=document.createElement('span');chip.className='notes-inline-tag';chip.textContent=item.text;
      const top=item.rect.top-mirrorRect.top+borderTop-1+(item.rect.height-14)/2;
      const left=item.rect.left-mirrorRect.left+borderLeft-3;
      Object.assign(chip.style,{left:left+'px',top:top+'px',width:(item.rect.width+4)+'px'});
      layer.append(chip);positions.push(top);
    }
    for(const item of measuredDividers) {
      const divider=document.createElement('div');divider.className='notes-group-divider';
      divider.textContent='- '.repeat(256);
      Object.assign(divider.style,{left:style.paddingLeft,right:style.paddingRight,height:style.lineHeight,
        lineHeight:style.lineHeight,font:style.font});
      const count=document.createElement('span');count.className='notes-group-count';
      count.textContent=document.documentElement.lang==='en'
        ? item.count+' '+(item.count===1?'link':'links')
        : item.count+' bağlantı';
      divider.append(count);layer.append(divider);
      positions.push(item.top);
    }
    scroll();
  }
  function render() {if(!frame) frame=requestAnimationFrame(measure);}
  editor.addEventListener('scroll',scroll,{passive:true});
  if(typeof ResizeObserver==='function') new ResizeObserver(render).observe(editor);
  else window.addEventListener('resize',render,{passive:true});
  return {render};
}};