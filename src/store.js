import { reactive } from 'vue'

// 苹果系统色板（HIG System Colors）：蓝 / 红 / 绿 / 橙 / 灰
export const THEME_COLORS = [
  { name: '系统蓝', value: '#007AFF' },
  { name: '系统红', value: '#FF3B30' },
  { name: '系统绿', value: '#34C759' },
  { name: '系统橙', value: '#FF9500' },
  { name: '系统灰', value: '#8E8E93' }
]

// 副标题排序选项（对应原型图设置弹窗中的 4 个单选）
export const ORDER_OPTIONS = [
  { label: '时间 -> 主体 -> 其它', value: 'time-subject-other' },
  { label: '时间 -> 其它 -> 主体', value: 'time-other-subject' },
  { label: '其它 -> 主体 -> 时间', value: 'other-subject-time' },
  { label: '主体 -> 其它 -> 时间', value: 'subject-other-time' }
]

let uid = 100
const nid = () => ++uid

function makeSettings() {
  return { showTime: true, showSubject: true, showOther: true, order: 'time-subject-other' }
}

// 虚构测试数据（示例人物，非真实信息）
export function createDefaultData() {
  return {
    themeColor: THEME_COLORS[0].value,
    resumeName: '张三的简历',
    basicEnabled: true,
    photo: { url: '', show: false },
    // 自定义字段草稿：输入时实时预览，点＋后固化到 basicFields
    customDraft: { key: '', value: '' },
    basicFields: [
      { key: 'name', label: '姓名', value: '张三', type: 'text' },
      { key: 'gender', label: '性别', value: '男', type: 'select', options: ['男', '女'] },
      { key: 'edu', label: '学历', value: '本科', type: 'text' },
      { key: 'age', label: '年龄', value: '27岁', type: 'text' },
      { key: 'phone', label: '电话号码', value: '13800000000', type: 'text' },
      { key: 'email', label: '个人邮箱', value: 'zhangsan@example.com', type: 'text' },
      { key: 'cert', label: '英语证书', value: 'CET-6', type: 'text' }
    ],
    sections: [
      {
        id: nid(),
        type: 'skills',
        title: '技能清单',
        collapsed: false,
        enabled: true,
        subtitle: { start: '2021-07', end: '2021-07', toNow: false, subject: '示例科技有限公司', other: '技术部' },
        settings: makeSettings(),
        lines: [
          { id: nid(), html: '<b>编程语言：</b>掌握 Java、Python 基础语法，具备面向对象编程思想，能够独立完成基础模块开发' },
          { id: nid(), html: '<b>前端技术：</b>熟悉 HTML、CSS、JavaScript，了解 Vue 3 组件化开发与响应式数据绑定' },
          { id: nid(), html: '<b>开发工具：</b>熟练使用 Git 版本控制、IDEA 开发环境，掌握 Maven 依赖管理与项目构建' },
          { id: nid(), html: '<b>计算机网络：</b>了解 HTTP/HTTPS 协议、TCP/IP 基础模型，具备常见的网络问题排查能力' }
        ]
      },
      {
        id: nid(),
        type: 'work',
        title: '工作经历',
        collapsed: false,
        enabled: true,
        subtitle: { start: '2021-07', end: '2024-06', toNow: false, subject: '示例科技有限公司', other: 'Java开发工程师' },
        settings: makeSettings(),
        lines: [
          { id: nid(), html: '<b>项目名称：</b>示例商城 - 电商后台管理系统' },
          { id: nid(), html: '<b>项目描述：</b>示例商城是一个面向中小企业的电商平台，包含商品管理、订单管理、用户中心等模块，为公司业务提供稳定的线上交易支持。' },
          { id: nid(), html: '<b>主要工作：</b>' },
          { id: nid(), html: '1、负责订单模块的后端开发与接口维护；' },
          { id: nid(), html: '2、参与需求评审，按需求文档完成功能模块开发，并配合测试完成功能验证；' },
          { id: nid(), html: '3、跟进线上问题排查与修复，保障系统稳定运行；' },
          { id: nid(), html: '4、编写接口文档，定期总结开发过程中的问题并分享解决方案。' }
        ]
      },
      {
        id: nid(),
        type: 'project',
        title: '项目经历',
        collapsed: false,
        enabled: true,
        subtitle: { start: '2023-03', end: '2024-01', toNow: false, subject: '示例科技', other: '项目负责人' },
        settings: makeSettings(),
        lines: [
          { id: nid(), html: '<b>项目名称：</b>数据可视化看板系统' },
          { id: nid(), html: '<b>项目描述：</b>系统基于 Spring Boot + Vue 开发，用于展示业务运营数据，包含数据统计、报表生成、权限管理等模块，帮助团队快速掌握业务指标。' },
          { id: nid(), html: '<b>主要工作：</b>' },
          { id: nid(), html: '1、负责后端接口设计与开发；' },
          { id: nid(), html: '2、参与数据库表结构设计与查询优化；' },
          { id: nid(), html: '3、完成权限模块的开发与系统安全加固；' },
          { id: nid(), html: '4、配合前端完成联调，保障功能按期上线。' }
        ]
      }
    ]
  }
}

export const store = reactive(createDefaultData())

// MVP：保存/重置先用 localStorage 模拟
// 版本号升级到 v6：让示例人物"张三"强制生效，避免旧存档覆盖
const STORAGE_KEY = 'resume-mvp-v6'

export function saveResume() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function resetResume() {
  localStorage.removeItem(STORAGE_KEY)
  Object.assign(store, createDefaultData())
}

const saved = localStorage.getItem(STORAGE_KEY)
if (saved) {
  try {
    Object.assign(store, JSON.parse(saved))
  } catch (e) {
    /* 数据损坏则使用默认数据 */
  }
}

// ============ JSON 文件备份 / 恢复 ============
// 备份文件格式：带版本号与导出时间的包装对象，data 里是完整的 store 快照
function pad2(n) {
  return n < 10 ? '0' + n : '' + n
}

export function exportBackup() {
  const now = new Date()
  const stamp = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}_${pad2(now.getHours())}${pad2(now.getMinutes())}`
  const payload = {
    app: 'my-cv-resume',
    version: 1,
    exportedAt: now.toISOString(),
    data: JSON.parse(JSON.stringify(store)) // 去掉 Vue 响应式代理，得到纯对象
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const safeName = String(store.resumeName || 'resume').replace(/[\\/:*?"<>|]/g, '_')
  a.href = url
  a.download = `${safeName}_${stamp}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// 恢复：读取 JSON 文件 → 校验结构 → 覆盖 store → 同步写入 localStorage
export function importBackup(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result)
        // 兼容带包装的新格式与裸 store 对象
        const data = parsed && typeof parsed === 'object' && parsed.data ? parsed.data : parsed
        if (!data || typeof data !== 'object' || !Array.isArray(data.basicFields) || !Array.isArray(data.sections)) {
          reject(new Error('文件内容不是有效的简历备份'))
          return
        }
        Object.assign(store, data)
        // 提升 uid，避免恢复后的 id 与后续新增行/模块冲突
        const nums = []
        data.sections.forEach((s) => {
          if (typeof s.id === 'number') nums.push(s.id)
          ;(s.lines || []).forEach((l) => {
            if (typeof l.id === 'number') nums.push(l.id)
          })
        })
        if (nums.length) uid = Math.max(uid, ...nums)
        saveResume()
        resolve()
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}

// 供设置弹窗/预览计算副标题各段内容
export function subtitleParts(section) {
  const s = section.subtitle
  const st = section.settings
  const map = {
    time: st.showTime && s.start ? `${s.start} ~ ${s.toNow ? '至今' : s.end}` : '',
    subject: st.showSubject ? s.subject : '',
    other: st.showOther ? s.other : ''
  }
  return st.order.split('-').map(k => map[k]).filter(Boolean)
}

export function addLine(section) {
  section.lines.push({ id: nid(), html: '请填写内容' })
}

export function moveSection(index, dir) {
  const arr = store.sections
  const target = index + dir
  if (target < 0 || target >= arr.length) return
  const [item] = arr.splice(index, 1)
  arr.splice(target, 0, item)
}

export function removeSection(index) {
  store.sections.splice(index, 1)
}
