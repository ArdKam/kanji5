import {applyAttempt,applyExposure,contentKey,emptyStore,getContentItem,hasExposedContent,trimStore} from './v1.9-content-learning-core.js';

const state=window.__KANJI5_STATE__;
if(!state)throw new Error('KANJI5_STATE_REQUIRED');

const COMPONENT_KEY='v19ContentLearning';
const STORE_LIMIT=512;

function read(){
  const components=state.readComponents?.()||{};
  const raw=components[COMPONENT_KEY];
  return trimStore(raw&&typeof raw==='object'?raw:emptyStore(),STORE_LIMIT);
}

function write(store){
  const components=state.readComponents?.()||{};
  return Boolean(state.writeComponents?.({...components,[COMPONENT_KEY]:trimStore(store,STORE_LIMIT)}));
}

export function getContentItem(mode,contentId){
  return getContentItemLocal(read(),mode,contentId);
}

function getContentItemLocal(store,mode,contentId){
  return getContentItem(store,mode,contentId);
}

export function hasExposure(mode){
  return hasExposedContent(read(),mode);
}

export function markExposure(detail={}){
  if(!detail?.mode||!detail?.contentId)return false;
  return write(applyExposure(read(),detail,Date.now()));
}

export function recordAttempt(detail={}){
  if(!detail?.mode||!detail?.contentId)return false;
  return write(applyAttempt(read(),detail,Date.now()));
}

export function listExposedContent(mode){
  const store=read();
  return Object.values(store.items).filter(item=>String(item?.mode||'')===String(mode||'')&&item?.state!=='unseen');
}

export function contentIdentity(mode,contentId){
  return contentKey(mode,contentId);
}

export function clear(){
  const components=state.readComponents?.()||{};
  const next={...components};
  delete next[COMPONENT_KEY];
  return Boolean(state.writeComponents?.(next));
}
