/**
 * Created by  on 2017/8/18.
 * 封装Vue 全局method、param
 * 实例中调用：this.zMethod.getValueByUrl()
 */
import store from '../store/store'
import http from '../utils/http'
import exportProgress from '../modules/components/exportProgress/exportProgress.vue'
import Message from 'element-ui/packages/message/index.js'
import Vue from 'vue';

let uuid = require('uuid/v4')
let theExportProgress = null
const { exportJsonToExcel } = require('../vendor/Export2Excel')
let exportDataStr = ''
let exportData = []


let zMethod = {
    /**
     * 解析 url 参数
     * @param name
     * @returns {*}
     */
    getValueByUrl(name) {
        let reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i')
        let searchStr = window.location.href.split('?')
        let r = searchStr[1] ? searchStr[1].match(reg) : null
        if(r != null) return decodeURI(r[2])
        return null
    },
    /**
     * 获取url 中所有参数
     * @returns {Object}
     */
    getParamsByUrl() {
        let url = location.search;
        let params = new Object();
        if(url.indexOf("?") != -1) {
            let str = url.substr(1);
            let strs = str.split("&");
            for(var i = 0; i < strs.length; i++) {
                params[strs[i].split("=")[0]] = decodeURIComponent(strs[i].split("=")[1]);
            }
            return params;
        }
    },
    /**
     * 复制对象  浅复制
     * @param newObj
     * @param oldObj
     * @returns {*}
     */
    copyObjByKey(newObj, oldObj) {
        for(let key of Object.keys(newObj)) {
            newObj[key] = oldObj[key]
        }
        return newObj
    },
    //    /**
    //   * 复制对象  深度复制
    //   * @param newObj
    //   * @param oldObj
    //   * @returns {*}
    //   */
    //  copyObjByKey(newObj,oldObj){
    //    if(oldObj instanceof Object && Object.keys(oldObj).length == 0){
    //      return JSON.parse(JSON.stringify(newObj))
    //    }else{
    //      return JSON.parse(JSON.stringify(oldObj))
    //    }
    //  },
    /**
     * 格式化 日期
     * @param timeStamp
     * @param formatStr
     * @returns {string}
     */
    formatDate(timeStamp, formatStr) {
        if(timeStamp) {
            return new Date(timeStamp).format(formatStr)
        } else {
            return ''
        }
    },
    /**
     * 设置指定 日期时间
     * @param interval  距当天 interval 天 (默认当天)
     * @param times     指定时分秒
     */
    getTimestampByDate(interval = 0, times = [0, 0, 0]) {
        return new Date(new Date().setDate(new Date().getDate() - interval)).setHours(...times)
    },
    /**
     *  是否包含该权限点
     * @param permissionKey  权限点 key
     * @returns {boolean}
     */
    hasPermissionByKey(permissionKey) {
        if(!permissionKey) {
            return true
        } else {
            return store.state.user.permissions.includes(permissionKey)
        }
    },
    /**
     * 数字 百分比 格式化
     * @param val
     * @returns {string}
     */
    formatPercent(val) {
        return val ? (val * 100).toFixed(2) + '%' : '0.00%'
    },
    /**
     * 数字 千分位 格式化
     * @param val
     * @returns {string}
     */
    formatThousand(val) {
        return("" + val).replace(/(\d{1,3})(?=(\d{3})+(?:$|\.))/g, "$1,");
    },
    /**
     *
     * @param container 外层容器
     * @param target    目标元素
     * @returns {*}
     */
    contains(container, target) {
        let _this = container;
        let childList = Array.from(_this.children);
        if(childList instanceof Array && childList.length > 0) {
            for(let i = 0; i < childList.length; i++) {
                if(childList[i] === target) {
                    return true;
                } else {
                    let value = this.contains(childList[i], target);
                    if(value) {
                        return value;
                    } else {
                        continue
                    }
                }
            }
        } else {
            if(_this === target) {
                return true;
            }
        }
    },
    /**
     *
     * @param params
     * @param rule
     * @param val
     * @param orVal
     * @returns {*}
     */
    turnToDouble(params, rule, val, orVal) {
        if(params == rule) {
            return val
        } else {
            return orVal
        }
    },
    /**
     * 导出当前页
     * @param url 请求路径
     * @param data 请求参数 (包含分页信息)
     * @param fileName 下载文件名
     * @param extraObj  额外参数 配置 dataContent、dataTotal
     */
    exportCurData(url, data, fileName, extraObj) {
        let obj = Object.assign({}, {
            dataContent: 'pageContent',
            dataTotal: 'total',
        }, extraObj)
        let params = Object.assign({}, data, {
            isCurrentPage: true
        })
        this.showProgressDialog()
        //exportDataStr = ''
        exportData = []
        http.post(url, params).then(res => {
            let result = res.data.data
            if(!result || !result[obj.dataContent] || result[obj.dataContent].length < 1) {
                theExportProgress.dialogVisible = false
                Message({
                    message: `暂无数据！`,
                    type: 'warning',
                    duration: 3 * 1000
                })
                return
            }
            if(theExportProgress.dialogVisible === false) {
                return
            }

            theExportProgress.totalNum = result[obj.dataContent].length - 1
            theExportProgress.curNum = result[obj.dataContent].length - 1

            //exportDataStr += this.getStrByData(result[obj.dataContent])
            exportData = exportData.concat(result[obj.dataContent])
            //this.exportToCSV(exportDataStr, fileName)
            this.exportToExcel(exportData,fileName)
            setTimeout(() => {
                theExportProgress.dialogVisible = false
            }, 100)
        }).catch(err => {
            console.log(err)
            theExportProgress.dialogVisible = false
            //	this.exportToCSV(exportDataStr, fileName)
            this.exportToExcel(exportData,fileName)
        })
    },
    /**
     * 导出全部
     * @param url 请求路径
     * @param data 请求参数  (不包含分页信息)
     * @param fileName 下载文件名
     * @param extraObj  额外参数 配置 dataContent、dataTotal
     */
    exportAllData(url, data, fileName, extraObj) {
        let obj = Object.assign({}, {
            dataContent: 'pageContent', //  数据data list
            dataTotal: 'total', //  总条数
            pageNumKey: 'pageNum', //  当前页下标 key
            pageSizeKey: 'pageSize', //  当前页量 key
            pageNum: 1, //  当前页小标
            pageSize: 200, //  当前页量
        }, extraObj)
        let params = Object.assign({}, data, {
            [obj.pageSizeKey]: obj.pageSize,
            [obj.pageNumKey]: obj.pageNum
        })
        this.showProgressDialog()
        //exportDataStr = ''
        exportData = []
        this.getExportData(url, params, fileName, obj)
    },
    /**
     * 展示 导出进度条
     */
    showProgressDialog() {
        if(!theExportProgress) {
            theExportProgress = new Vue(exportProgress).$mount()
            document.body.appendChild(theExportProgress.$el);
        }
        theExportProgress.dialogVisible = true
        theExportProgress.totalNum = 0
        theExportProgress.curNum = 0
    },
    /**
     * 获取导出 data
     * @param url
     * @param params
     * @param allData
     * @param fileName
     */
    getExportData(url, params, fileName, obj) {
        http.post(url, params).then(res => {
            let result = res.data.data
            if(!result || !result[obj.dataContent] || result[obj.dataContent].length < 1) {
                theExportProgress.dialogVisible = false
                Message({
                    message: `共${theExportProgress.totalNum}条数据，当前已导出${theExportProgress.curNum}条,遗失${theExportProgress.totalNum - theExportProgress.curNum}条,建议重新导出!`,
                    type: 'warning',
                    duration: 3 * 1000
                })
                throw new Error(`第${params[obj.pageNumKey]}页暂无数据，共${theExportProgress.totalNum}条数据，当前已导出${theExportProgress.curNum}条`)
                return
            }
            if(theExportProgress.dialogVisible === false) {
                return
            }
            theExportProgress.totalNum = result[obj.dataTotal]
            theExportProgress.curNum += result[obj.dataContent].length
            theExportProgress.curNum = params[obj.pageNumKey] === 1 ? theExportProgress.curNum - 1 : theExportProgress.curNum
            if(result[obj.dataTotal] > theExportProgress.curNum) {
                params[obj.pageNumKey]++
                this.getExportData(url, params, fileName, obj)
                //exportDataStr += this.getStrByData(result[obj.dataContent])
                exportData = exportData.concat(result[obj.dataContent])
            } else {
                //exportDataStr += this.getStrByData(result[obj.dataContent])
                //this.exportToCSV(exportDataStr, fileName)
                exportData = exportData.concat(result[obj.dataContent])
                this.exportToExcel(exportData,fileName)
                setTimeout(() => {
                    theExportProgress.dialogVisible = false
                }, 100)
            }
        }).catch(err => {
            console.warn(err)
            theExportProgress.dialogVisible = false
            //this.exportToCSV(exportDataStr, fileName)
            this.exportToExcel(exportData,fileName)
        })
    },
    /**
     * 获取格式化 .csv
     * @param allData
     * @returns {string}
     */
    getStrByData(allData) {
        let str = ''
        for(let i = 0; i < allData.length; i++) {
            for(let key in allData[i]) {
                //str += '\"' + allData[i][key] + '\t\",'
                str +=  allData[i][key] + ','
            }
            str += '\r\n'
        }
        return str
    },
    /**
     * 导出 excel
     * @param allData
     * @param fileName
     * 无法解决 科学计数法、时间类型长度过长显示 ###
     * 单元格类换行必须是字符串内 换行，导致copy出来格式混乱
     */
    exportToCSV(str, fileName) {
        //let uri = 'data:application/vnd.ms-excel;base64,';
        let blob = new Blob(["\ufeff" + str], {
            type: 'text/csv'
        }); //解决大文件下载失败
        let aEle = document.createElement('a')
        aEle.download = fileName + '.csv'
        aEle.href = URL.createObjectURL(blob)
        aEle.click()
    },
    base64(str) {
        return window.btoa(unescape(encodeURIComponent(str)))
    },
    /**
     * 下载文件
     * @param url  指定路径
     * @param fileName 自定义文件名
     */
    downloadFile(url, fileName) {
        let aEle = document.createElement('a')
        aEle.download = fileName
        aEle.href = url
        aEle.click()
    },
    /**
     * 导出excel
     * @param exportData
     * @param fileName
     */
    exportToExcel(exportData, fileName){
        const tHeader = []
        const filterVal = []
        for(let [key,value] of Object.entries(exportData[0])){
            tHeader.push(value)
            filterVal.push(key)
        }
        const list = exportData.slice(1)
        const data = list.map(v => filterVal.map(j => v[j]))
        exportJsonToExcel(tHeader, data, fileName)
    },
    /**
     * 获取 hash
     * @returns {string}
     */
    getHashByTimestamp() {
        // return new Date().getTime() + '' + parseInt(Math.random() * 1000)
        return uuid()
    },
    /**
     * 获取随机数（时间戳）
     */
    getRanDomByTimestamp() {
        return new Date().getTime() + '' + parseInt(Math.random() * 1000)
    },

}
let zParam = {
    public: true,
    pageLoading: {
        lock: true,
        spinner: 'iconfont icon-loading',
        customClass: 'page-loading'
    },
    clientWidth: window.innerWidth,
    clientHeight: window.innerHeight,
    defaultCodeMsg: '无效网点，请选择有效网点',
    userCodeMsg: '无效用户，需手动选择用户',
    startDateMsg: '开始时间不能大于结束时间',
    endDateMsg: '结束时间不能小于开始时间',
    dateInterval:'时间跨度不能超过一年',
    transferCodeMsg: '中心无效，请选择有效转运中心',
    weekTimestamp: 604799000, //一周时间戳
    monthTimestamp:2.592e9,//一年时间戳 30*24*60*60*1000
    yearTimestamp:3.1536e10,//一年时间戳 365*24*60*60*1000
}

export default {
    install(Vue) {
        Vue.prototype.zMethod = zMethod
        Vue.prototype.zParam = zParam
    }
}
