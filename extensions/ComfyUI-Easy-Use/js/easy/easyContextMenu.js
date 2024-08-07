import {app} from "//comfyui.nodecomfy.com/scripts/app.js";
import {api} from "//comfyui.nodecomfy.com/scripts/api.js";
import {$el} from "//comfyui.nodecomfy.com/scripts/ui.js";
import {$t} from "../common/i18n.js";
import {getExtension, spliceExtension} from '../common/utils.js'
import {toast} from "../common/toast.js";

const setting_id = "Comfy.EasyUse.MenuNestSub"
let enableMenuNestSub = false
let thumbnails = []

export function addMenuNestSubSetting(app) {
	app.ui.settings.addSetting({
		id: setting_id,
		name: $t("Enable ContextMenu Auto Nest Subdirectories (ComfyUI-Easy-Use)"),
		type: "boolean",
		defaultValue: enableMenuNestSub,
		onChange(value) {
			enableMenuNestSub = !!value;
		},
	});
}

const getEnableMenuNestSub = _ => app.ui.settings.getSettingValue(setting_id, enableMenuNestSub)


const Loaders = ['easy fullLoader','easy a1111Loader','easy comfyLoader']
app.registerExtension({
    name:"comfy.easyUse.contextMenu",
    async setup(app){
        addMenuNestSubSetting(app)
         // 获取所有模型图像
        const imgRes = await api.fetchApi(`/easyuse/models/thumbnail`)
        if (imgRes.status === 200) {
            let data = await imgRes.json();
            thumbnails = data
        }
        else if(getEnableMenuNestSub()){
            toast.error($t("Too many thumbnails, have closed the display"))
        }
        const existingContextMenu = LiteGraph.ContextMenu;
        LiteGraph.ContextMenu = function(values,options){
            const threshold = 10;
            const enabled = getEnableMenuNestSub();
            if(!enabled || (values?.length || 0) <= threshold || !(options?.callback) || values.some(i => typeof i !== 'string')){
                if(enabled){
                    // console.log('Skipping context menu auto nesting for incompatible menu.');
                }
                return existingContextMenu.apply(this,[...arguments]);
            }
            const compatValues = values;
            const originalValues = [...compatValues];
            const folders = {};
            const specialOps = [];
            const folderless = [];
            for(const value of compatValues){
                const splitBy = value.indexOf('/') > -1 ? '/' : '\\';
                const valueSplit = value.split(splitBy);
                if(valueSplit.length > 1){
                    const key = valueSplit.shift();
                    folders[key] = folders[key] || [];
                    folders[key].push(valueSplit.join(splitBy));
                }else if(value === 'CHOOSE' || value.startsWith('DISABLE ')){
                    specialOps.push(value);
                }else{
                    folderless.push(value);
                }
            }
            const foldersCount = Object.values(folders).length;
            if(foldersCount > 0){
                const oldcallback = options.callback;
                options.callback = null;
                const newCallback = (item,options) => {
                    if(['None','无','無','なし'].includes(item.content)) oldcallback('None',options)
                    else oldcallback(originalValues.find(i => i.endsWith(item.content),options));
                };
                const addContent = (content, folderName='') => {
                    const name = folderName ? folderName + '\\' + spliceExtension(content) : spliceExtension(content);
                    const ext = getExtension(content)
                    const time = new Date().getTime()
                    let thumbnail = ''
                    if(['ckpt', 'pt', 'bin', 'pth', 'safetensors'].includes(ext)){
                       for(let i=0;i<thumbnails.length;i++){
                            let thumb = thumbnails[i]
                            if(name && thumb && thumb.indexOf(name) != -1){
                                thumbnail = thumbnails[i]
                                break
                            }
                        }
                    }

                    let newContent
                    if(thumbnail){
                       const protocol = window.location.protocol
                       const host = window.location.host
                       const base_url = `${protocol}//${host}`
                       const thumb_url = thumbnail.replace(':','%3A').replace(/\\/g,'/')
                       newContent = $el("div.easyuse-model", {},[$el("span",{},content + ' *'),$el("img",{src:`${base_url}/${thumb_url}?t=${time}`})])
                    }else{
                       newContent = $el("div.easyuse-model", {},[
                           $el("span",{},content)
                       ])
                    }

                    return {
                        content,
                        title:newContent.outerHTML,
                        callback: newCallback
                    }
                }
                const newValues = [];
                for(const [folderName,folder] of Object.entries(folders)){
                    newValues.push({
                        content:folderName,
                        has_submenu:true,
                        callback:() => {},
                        submenu:{
                            options:folder.map(f => addContent(f,folderName)),
                        }
                    });
                }
                newValues.push(...folderless.map(f => addContent(f, '')));
                if(specialOps.length > 0)
                    newValues.push(...specialOps.map(f => addContent(f, '')));
                return existingContextMenu.call(this,newValues,options);
            }
            return existingContextMenu.apply(this,[...arguments]);
        }
        LiteGraph.ContextMenu.prototype = existingContextMenu.prototype;
    },

})

