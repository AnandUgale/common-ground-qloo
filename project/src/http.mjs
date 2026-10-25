import {FlowError} from './core.mjs';
export async function boundedText(responseOrRequest,limit,code) {
  const reader=responseOrRequest.body?.getReader();
  if(!reader)return '';
  const decoder=new TextDecoder();let size=0,text='';
  try {
    while(true){
      const {done,value}=await reader.read();if(done)break;
      size+=value.byteLength;
      if(size>limit){await reader.cancel();throw new FlowError(code,'Data exceeded the application byte limit.');}
      text+=decoder.decode(value,{stream:true});
    }
    return text+decoder.decode();
  } finally {reader.releaseLock();}
}
