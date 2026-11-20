import { store } from '../store.js'

/**
 * 导出 PDF：克隆右侧简历 DOM 到新窗口，携带当前页面全部样式后打印。
 * 保证导出的 PDF 与右侧预览渲染效果一致。
 */
export function exportResumePdf() {
  const paper = document.querySelector('.resume-paper')
  if (!paper) return

  // 收集当前文档中所有样式（Vite dev 注入的 <style> 与构建后的 <link>）
  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join('\n')

  const win = window.open('', '_blank', 'width=960,height=720')
  if (!win) return

  win.document.write(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<title>${store.resumeName || '简历'}</title>
${styles}
<style>
  /* 强制打印背景色与主题色 */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
  }
  .resume-paper {
    box-shadow: none !important;
    margin: 0 auto !important;
  }
  @page {
    size: A4;
    margin: 0;
  }
</style>
</head>
<body>${paper.outerHTML}</body>
</html>`)
  win.document.close()

  let printed = false
  const doPrint = () => {
    if (printed) return
    printed = true
    win.focus()
    win.print()
  }
  win.onload = doPrint
  // 兜底：部分浏览器新窗口 onload 不触发
  setTimeout(doPrint, 600)
  // 打印结束（或取消）后自动关闭新窗口
  win.onafterprint = () => win.close()
}
