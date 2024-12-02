import {app} from '../../../scripts/app.js'
import {api} from '../../../scripts/api.js'
import {ComfyWidgets} from '../../../scripts/widgets.js'
import {$el} from '../../../scripts/ui.js'

// 添加样式
const styleElement = document.createElement("style");
const cssCode = `
    #msgDiv{
      width:800px;
      height: 200px;
      text-align: center;
      font-size: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding-bottom: 40px;
      color: var(--fg-color);
    }
    #qrCode{
      display: block;
      width:256px;
      height:256px;
      border-radius: 10px;
    }
    #qrBox{
      display: block;
      text-align: center;
      display:flex;
      flex-wrap: wrap;
      justify-content: center;
      width: 360px;
      margin：auto;
    }
    #qrDesc{
      display: block;
      text-align: center;
      margin-top: 20px;
      color: #ffffff;
      width: 360px;
    }
    .codeImg {
      // display: block;
      width:256px;
      height:256px;
      border-radius: 10px;
      padding: 10px;
      border: 2px solid #ffffff;
    }
    .codeDesc {
      display: block;
      text-align: center;
      margin-top: 20px;
      color: #ffffff;
      width: 360px;
      font-size: 16px;
    }
    .codeDiv {
      color: #ffffff;
    }
    .codeBox {
      display: flex;
      text-align: center;
    }
    #directions {
      margin-top: 10px;
      width: 100%;
      text-align: left;
      color: #ffffff;
      font-size: 8px;
    }
    .tech_button {
      flex:1;
      height:30px;
      border-radius: 8px;
      border: 2px solid var(--border-color);
      font-size:11px;
      background:var(--comfy-input-bg);
      color:var(--error-text);
      box-shadow:none;
      cursor:pointer;
      width: 1rem;
    }
    #tech_box {
      max-height: 80px;
      display:flex;
      flex-wrap: wrap;
      align-items: flex-start;
    }
    .uniqueid {
      display: none;
    }
    #showMsgDiv {
      width:800px;
      padding: 60px 0;
      text-align: center;
      font-size: 30px;
      color: var(--fg-color);
    }
`
styleElement.innerHTML = cssCode
document.head.appendChild(styleElement);

var techsidkey = 'techsid' + window.location.port;
var loading = false;
const msgBox = $el("div.comfy-modal", {parent: document.body}, []);
const msgDiv = $el('div', {id: 'msgDiv'}, '');
msgBox.appendChild(msgDiv);
msgBox.style.display = "none";
msgBox.style.zIndex = 10001;
let manager_instance = null;

function setCookie(name, value, days = 1) {
    var data = {
        value: value,
        expires: new Date(new Date().getTime() + (days * 24 * 60 * 60 * 1000))
    };
    localStorage.setItem(name, JSON.stringify(data));
}

function getCookie(name) {
    var data = localStorage.getItem(name);
    if (!data) {
        return '';  // 未找到数据，返回空字符串
    }
    data = JSON.parse(data);
    if (new Date(data.expires) > new Date()) {
        return data.value;  // 数据有效，返回存储的值
    } else {
        localStorage.removeItem(name);  // 数据过期，删除项
        return '';  // 数据过期，返回空字符串
    }
}


function generateTimestampedRandomString() {
    const timestamp = Date.now().toString(36);
    const randomString = Array(3).fill(0).map(() => Math.random().toString(36).substring(2)).join('').substring(0, 18);
    const timestampedRandomString = (timestamp + randomString).substring(0, 32);
    return timestampedRandomString;
}


function showLoading(msg = '') {
    hideLoading();
    msgDiv.innerText = msg ? msg : '请稍后...';
    msgBox.style.display = "block";
    loading = true;
}

function hideLoading() {
    msgBox.style.display = "none";
    loading = false;
}

function showToast(msg = '', t = 0) {
    t = t > 0 ? t : 2000;
    msgDiv.innerText = msg ? msg : '谢谢';
    msgBox.style.display = "block";
    setTimeout(() => {
        msgBox.style.display = "none";
    }, t);
}

var serverUrl = window.location.href;
const qrCode = $el('img', {
    id: 'qrCode', src: ``,
    onerror: () => {
        // console.log('参数错误');
    }
})
const qrDesc = $el('div', {id: 'qrDesc'}, '')
const qrInnerHtml = $el('div', {id: 'qr-inner'}, '')
const qrBox = $el('div', {id: 'qrBox'}, [qrInnerHtml])
app.ui.dialog.element.style.zIndex = 10010;

function getMsgByEnglish(en_str){
    var lang = getCookie('deploy_lang');
    if (lang == 'en') {
        return en_str;
    }
    const msgDict = {
        'Please wait...': '请稍后...',
        'There can only be one "DeployCash" node in a workflow': '工作流中只能有一个"DeployCash"节点',
        'Please make sure that there is only one "SaveImgae", "DeployCash_saveImage" or "VHS_VideoCombine" node in the workflow.': '请确保工作流中只有一个"SaveImgae"、"DeployCash_saveImage"或"VHS_VideoCombine"节点。',
        'Instructions for use of works': '作品使用说明',
        '"app_img1" can only connect "LoadImage" node': '"app_img1" 只能连接 "LoadImage" 节点',
        '"app_img2" can only connect "LoadImage" node': '"app_img2" 只能连接 "LoadImage" 节点',
        '"app_img3" can only connect "LoadImage" node': '"app_img3" 只能连接 "LoadImage" 节点',
        '"custom_img1" can only connect "LoadImage" node': '"custom_img1"只能连接"LoadImage"节点',
        '"custom_img2" can only connect "LoadImage" node': '"custom_img2"只能连接"LoadImage"节点',
        '"custom_img3" can only connect "LoadImage" node': '"custom_img3"只能连接"LoadImage"节点',
        '"custom_video1" can only connect "Load Video (Upload)" node': '"custom_video1" 只能连接"加载视频（上传）"节点',
        '"custom_video2" can only connect "Load Video (Upload)" node': '"custom_video2" 只能连接"加载视频（上传）"节点',
        '"custom_video3" can only connect "Load Video (Upload)" node': '"custom_video3" 只能连接"加载视频（上传）"节点',
        '"custom_text1" can only connect "textInput" node': '"custom_text1"只能连接"textInput"节点',
        '"custom_text2" can only connect "textInput" node': '"custom_text2"只能连接"textInput"节点',
        '"custom_text3" can only connect "textInput" node': '"custom_text3"只能连接"textInput"节点',
        '"app_title", Cannot be empty, please fill in the title of the work': '"app_title"不能为空，请填写作品标题',
        '"app_desc", Cannot be empty, please fill in the function introduction of the work': '"app_desc"不能为空，请填写作品功能介绍',
        'Please fill in the description of the work': '请填写作品描述',
        '"app_fee" Cannot be less than 0 points, i.e. 0 $': '"app_fee"不能小于0积分，即0$',
        '"free_times" Cannot be less than 0': '"free_times"不能小于0',
        'Click here to transfer the workflow to the web/H5 and obtain the access address': '点此，工作流转小程序/H5，并获取访问地址',
        'Processing, please wait...': '正在处理，请稍候...'
    };
    return en_str in msgDict ? msgDict[en_str] : '';
}

const showMsgDiv = $el('div', {id: 'showMsgDiv'}, getMsgByEnglish('Please wait...'));

function showCodeBox(html) {
    app.ui.dialog.close();
    var htmlBox = $el('div.codeBox', {}, '');
    htmlBox.innerHTML = html;
    app.ui.dialog.show(htmlBox);
}


function showQrBox(img, desc, html) {
    app.ui.dialog.close();
    // qrDesc.innerText = desc;
    // qrCode.src = img;
    qrInnerHtml.innerHTML = html;
    // qrDesc.innerHTML = html;
    qrBox.style.margin = 'auto';
    app.ui.dialog.show(qrBox);
}

function hideCodeBox() {
    app.ui.dialog.close();
}

function showMsg(msg) {
    app.ui.dialog.close();
    showMsgDiv.innerText = msg;
    app.ui.dialog.show(showMsgDiv);
}


function hideMsg() {
    app.ui.dialog.close();
}

function tech_alert(text) {
    loading = false;
    // alert(text);
    showMsg(text);
}

function getPostData(prompt) {
    const output = prompt['output'];
    let HuiseNum = 0;
    let HuiseO = {};
    let HuiseN = {};
    let postData = {};
    let saveImageNodes = [];
    for (const key in output) {
        if (output[key].class_type == 'DeployCash') {
            HuiseO = output[key].inputs;
            HuiseNum++;
        }
        console.log(output[key].class_type)
        console.log(output[key].class_type)
        console.log(output[key].class_type)
        console.log(output[key].class_type)
        console.log(output[key].class_type)
        if (output[key].class_type == 'SaveImage' || output[key].class_type == 'VHS_VideoCombine' || output[key].class_type == 'DeployCash_saveImage') {
            output[key].res_node = key;
            saveImageNodes.push(output[key]);
        }
    }
    if (HuiseNum > 1) {
        return getMsgByEnglish('There can only be one "DeployCash" node in a workflow');
    }
    if (saveImageNodes.length < 1) {
        return (getMsgByEnglish('Please make sure that there is only one "SaveImgae", "DeployCash_saveImage" or "VHS_VideoCombine" node in the workflow.'));
    } else if (saveImageNodes.length > 1) {
        return (getMsgByEnglish('Please make sure that there is only one "SaveImgae", "DeployCash_saveImage" or "VHS_VideoCombine" node in the workflow.'));
    } else {
        postData['res_node'] = saveImageNodes[0].res_node;
    }
    if (HuiseO) {
        HuiseN['zhutu1'] = HuiseO['app_img1(optional)'];
        HuiseN['zhutu2'] = HuiseO['app_img2(optional)'];
        HuiseN['zhutu3'] = HuiseO['app_img3(optional)'];

        HuiseN['cs_img1'] = HuiseO['custom_img1(optional)'];
        HuiseN['cs_img2'] = HuiseO['custom_img2(optional)'];
        HuiseN['cs_img3'] = HuiseO['custom_img3(optional)'];
        HuiseN['cs_video1'] = HuiseO['custom_video1(optional)'];
        HuiseN['cs_video2'] = HuiseO['custom_video2(optional)'];
        HuiseN['cs_video3'] = HuiseO['custom_video3(optional)'];
        HuiseN['cs_text1'] = HuiseO['custom_text1(optional)'];
        HuiseN['cs_text2'] = HuiseO['custom_text2(optional)'];
        HuiseN['cs_text3'] = HuiseO['custom_text3(optional)'];
        HuiseN['title'] = HuiseO['app_title'];
        HuiseN['gn_desc'] = HuiseO['app_desc'];
        HuiseN['sy_desc'] = getMsgByEnglish('Instructions for use of works');
        HuiseN['server'] = serverUrl;
        HuiseN['fee'] = HuiseO['app_fee'];
        HuiseN['free_times'] = HuiseO['free_times'];
        HuiseN['cs_img1_desc'] = HuiseO['custom_img1_desc'];
        HuiseN['cs_img2_desc'] = HuiseO['custom_img2_desc'];
        HuiseN['cs_img3_desc'] = HuiseO['custom_img3_desc'];
        HuiseN['cs_video1_desc'] = HuiseO['custom_video1_desc'];
        HuiseN['cs_video2_desc'] = HuiseO['custom_video2_desc'];
        HuiseN['cs_video3_desc'] = HuiseO['custom_video3_desc'];
        HuiseN['cs_text1_desc'] = HuiseO['custom_text1_desc'];
        HuiseN['cs_text2_desc'] = HuiseO['custom_text2_desc'];
        HuiseN['cs_text3_desc'] = HuiseO['custom_text3_desc'];
        HuiseN['uniqueid'] = HuiseO['uniqueid'];
        postData['mainImages'] = [];
        if (HuiseN['zhutu1']) {
            if (output[HuiseN['zhutu1'][0]].class_type == 'LoadImage') {
                if (output[HuiseN['zhutu1'][0]].inputs.image) {
                    postData['mainImages'].push(output[HuiseN['zhutu1'][0]].inputs.image);
                }
            } else {
                return getMsgByEnglish('"app_img1" can only connect "LoadImage" node');
            }
        }
        if (HuiseN['zhutu2']) {
            if (output[HuiseN['zhutu2'][0]].class_type == 'LoadImage') {
                if (output[HuiseN['zhutu2'][0]].inputs.image) {
                    postData['mainImages'].push(output[HuiseN['zhutu2'][0]].inputs.image);
                }
            } else {
                return getMsgByEnglish('"app_img2" can only connect "LoadImage" node');
            }
        }
        if (HuiseN['zhutu3']) {
            if (output[HuiseN['zhutu3'][0]].class_type == 'LoadImage') {
                if (output[HuiseN['zhutu3'][0]].inputs.image) {
                    postData['mainImages'].push(output[HuiseN['zhutu3'][0]].inputs.image);
                }
            } else {
                return getMsgByEnglish('"app_img3" can only connect "LoadImage" node');
            }
        }

        postData['cs_img_nodes'] = [];
        if (HuiseN['cs_img1']) {
            if (output[HuiseN['cs_img1'][0]].class_type == 'LoadImage') {
                postData['cs_img_nodes'].push({node: HuiseN['cs_img1'][0], desc: HuiseN['cs_img1_desc']});
            } else {
                return getMsgByEnglish('"custom_img1" can only connect "LoadImage" node');
            }
        }
        if (HuiseN['cs_img2']) {
            if (output[HuiseN['cs_img2'][0]].class_type == 'LoadImage') {
                postData['cs_img_nodes'].push({node: HuiseN['cs_img2'][0], desc: HuiseN['cs_img2_desc']});
            } else {
                return getMsgByEnglish('"custom_img2" can only connect "LoadImage" node');
            }
        }
        if (HuiseN['cs_img3']) {
            if (output[HuiseN['cs_img3'][0]].class_type == 'LoadImage') {
                postData['cs_img_nodes'].push({node: HuiseN['cs_img3'][0], desc: HuiseN['cs_img3_desc']});
            } else {
                return getMsgByEnglish('"custom_img3" can only connect "LoadImage" node');
            }
        }

        postData['cs_video_nodes'] = [];
        if (HuiseN['cs_video1']) {
            if (output[HuiseN['cs_video1'][0]].class_type == 'VHS_LoadVideo') {
                postData['cs_video_nodes'].push({node: HuiseN['cs_video1'][0], desc: HuiseN['cs_video1_desc']});
            } else {
                return getMsgByEnglish('"custom_video1" can only connect "Load Video (Upload)" node');
            }
        }
        if (HuiseN['cs_video2']) {
            if (output[HuiseN['cs_video2'][0]].class_type == 'VHS_LoadVideo') {
                postData['cs_video_nodes'].push({node: HuiseN['cs_video2'][0], desc: HuiseN['cs_video2_desc']});
            } else {
                return getMsgByEnglish('"custom_video2" can only connect "Load Video (Upload)" node');
            }
        }
        if (HuiseN['cs_video3']) {
            if (output[HuiseN['cs_video3'][0]].class_type == 'VHS_LoadVideo') {
                postData['cs_video_nodes'].push({node: HuiseN['cs_video3'][0], desc: HuiseN['cs_video3_desc']});
            } else {
                return getMsgByEnglish('"custom_video3" can only connect "Load Video (Upload)" node');
            }
        }

        postData['cs_text_nodes'] = [];
        if (HuiseN['cs_text1']) {
            if (output[HuiseN['cs_text1'][0]] && typeof output[HuiseN['cs_text1'][0]].inputs !== 'undefined' && typeof output[HuiseN['cs_text1'][0]].inputs.text !== 'undefined') {
                postData['cs_text_nodes'].push({node: HuiseN['cs_text1'][0], desc: HuiseN['cs_text1_desc']});
            } else {
                return getMsgByEnglish('"custom_text1" can only connect "textInput" node');
            }
        }
        if (HuiseN['cs_text2']) {
            if (output[HuiseN['cs_text2'][0]] && typeof output[HuiseN['cs_text2'][0]].inputs !== 'undefined' && typeof output[HuiseN['cs_text2'][0]].inputs.text !== 'undefined') {
                postData['cs_text_nodes'].push({node: HuiseN['cs_text2'][0], desc: HuiseN['cs_text2_desc']});
            } else {
                return getMsgByEnglish('"custom_text2" can only connect "textInput" node');
            }
        }
        if (HuiseN['cs_text3']) {
            if (output[HuiseN['cs_text3'][0]] && typeof output[HuiseN['cs_text3'][0]].inputs !== 'undefined' && typeof output[HuiseN['cs_text3'][0]].inputs.text !== 'undefined') {
                postData['cs_text_nodes'].push({node: HuiseN['cs_text3'][0], desc: HuiseN['cs_text3_desc']});
            } else {
                return getMsgByEnglish('"custom_text3" can only connect "textInput" node');
            }
        }
        if (HuiseN['title']) {
            postData['title'] = HuiseN['title'];
        } else {
            return getMsgByEnglish('"app_title", Cannot be empty, please fill in the title of the work');
        }
        if (HuiseN['gn_desc']) {
            postData['gn_desc'] = HuiseN['gn_desc'];
        } else {
            return getMsgByEnglish('"app_desc", Cannot be empty, please fill in the function introduction of the work');
        }
        if (HuiseN['sy_desc']) {
            postData['sy_desc'] = HuiseN['sy_desc'];
        } else {
            return getMsgByEnglish('Please fill in the description of the work');
        }

        if (HuiseN['fee'] >= 0) {
            postData['fee'] = HuiseN['fee'];
        } else {
            return getMsgByEnglish('"app_fee" Cannot be less than 0 points, i.e. 0 $');
        }
        if (HuiseN['free_times'] >= 0) {
            postData['free_times'] = HuiseN['free_times'];
        } else {
            return getMsgByEnglish('"free_times" Cannot be less than 0');
        }
        postData['uniqueid'] = HuiseN['uniqueid'];
        postData['output'] = output;
        postData['workflow'] = prompt['workflow']
        return postData;
    }
}

async function requestExe(r, postData) {
    var techsid = getCookie(techsidkey);
    const response = await api.fetchApi(`/manager/tech_main`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            r: r,
            techsid: techsid,
            postData: postData
        })
    });
    if (!response.ok) {
        setTimeout(() => {
            showToast('Network connection error, please keep your computer connected to the Internet', 3000);
        }, 300);
        return;
    }
    const resdata = await response.json();
    return resdata;
}

async function login(s_key) {
    var techsid = getCookie(techsidkey);
    if (techsid) {
        return techsid;
    }
    let res = await requestExe('comfyui.apiv2.code', {s_key: s_key});
    if (app.ui.dialog.element.style.display != 'none') {
        if (res.data.data.techsid.length > 5) {
            return res.data.data.techsid;
        } else {
            await new Promise(resolve => setTimeout(resolve, 2000));
            return await login(s_key);
        }
    } else {
        return;
    }
}


async function request(r, postData) {
    showLoading(getMsgByEnglish('Processing, please wait...'));
    let resdata = await requestExe(r, postData);
    if (resdata.errno == 41009) {
        let resdata = await requestExe('comfyui.apiv2.code', {s_key: ''});
        if (resdata) {
            if (resdata.data.data.code == 1) {
                hideLoading();
                showQrBox(resdata.data.data.data, resdata.data.data.desc, resdata.data.data.html);
                let techsid = await login(resdata.data.data.s_key);
                setCookie(techsidkey, techsid, 7);
                hideCodeBox();
                if (techsid) {
                    postData['techsid'] = techsid;
                    return await request(r, postData);
                } else {
                    return;
                }
            } else {
                showToast(resdata.data.data.message);
                return;
            }
        }
    } else {
        hideLoading();
        return resdata;
    }
}

app.registerExtension({
    name: 'DeployCash',
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === 'DeployCash') {

            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                const r = onNodeCreated ? onNodeCreated?.apply(this, arguments) : undefined;
                const that = this;
                const tech_button = $el('button.tech_button', {
                        textContent: getMsgByEnglish('Click here to transfer the workflow to the web/H5 and obtain the access address'), style: {},
                        onclick: async () => {
                            if (loading) return;
                            hideCodeBox();
                            try {
                                const prompt = await app.graphToPrompt();
                                let postData = getPostData(prompt);
                                if (postData['output']) {
                                    try {
                                        let resdata = await request('comfyui.apiv2.upload', postData);
                                        if (resdata) {
                                            if (resdata.data.data.code == 1) {
                                                var lang = resdata.data.data.lang;
                                                setCookie('deploy_lang', lang, 7);
                                                showCodeBox(resdata.data.data.html);
                                            } else {
                                                // showToast(resdata.data.data.message);
                                                showMsg(resdata.data.data.message);
                                            }
                                        }
                                    } catch (error) {
                                        hideLoading();
                                    }

                                } else {
                                    tech_alert(postData);
                                    return;
                                }
                            } catch (error) {
                                tech_alert('获取api数据失败');
                                return;
                            }
                        }
                    }
                )
                const dstr1 = '1. Every time a new "DeployCash" node is created, it corresponds to a new work;';
                const directions = $el(
                    'div',
                    {id: 'directions'},
                    ['Special instructions:', $el('br'), dstr1,
                        // $el('br'), dstr2, $el('br'), dstr3
                    ])
                const tech_box = $el('div', {id: 'tech_box'}, [tech_button, directions])
                this.addDOMWidget('select_styles', "btn", tech_box);

                const inputEl = document.createElement("input");
                inputEl.setAttribute("type", "text");
                inputEl.setAttribute("list", "uedynamiclist");
                inputEl.setAttribute("value", generateTimestampedRandomString());
                inputEl.className = "uniqueid";
                this.addDOMWidget('uniqueid', "input", inputEl, {
                    getValue() {
                        return inputEl.value;
                    },
                    setValue(v) {
                        inputEl.value = v;
                    },
                });
                setTimeout(() => {
                    this.setSize([420, 500]);
                    // if(serverUrl) {
                    //   this.widgets[3].value = serverUrl;
                    // }
                    // if(this.widgets[16].value == '.*') {
                    //   this.widgets[16].value = generateTimestampedRandomString();
                    // }
                    // console.log(this.widgets[16].value);
                }, 200)
                // console.log(that);

                return r;
            }
            nodeType.prototype.onRemoved = function () {
                // 你想在节点删除时执行的操作
                // console.log("22Node removed:", this);
            };
            this.serialize_widgets = true //需要保存参数
        }
    }
})
