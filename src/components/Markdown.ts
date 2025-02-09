import { Component, computed, defineComponent, h, ref } from 'vue'
import highlightjs from 'markdown-it-highlightjs'
import markdownit from 'markdown-it'
import { IconClipboardCopy, IconCheck } from '@tabler/icons-vue'

const Markdown: Component = defineComponent({
  props: {
    source: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const md = ref<markdownit>(markdownit())
    const copiedStates = ref<{ [key: string]: boolean }>({})

    // Add copy button to code blocks
    const addCopyButton = (code: string, index: number, languageClass: string = '') => {
      const wrapperId = `code-wrapper-${index}`
      const isCopied = copiedStates.value[wrapperId] || false

      const copyCode = async () => {
        await navigator.clipboard.writeText(code)
        copiedStates.value[wrapperId] = true
        setTimeout(() => {
          copiedStates.value[wrapperId] = false
        }, 2000)
      }

      return `
        <div class="relative group">
          <button 
            onclick="document.querySelector('#${wrapperId}').click()"
            class="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ${isCopied 
              ? '<svg class="size-5 text-green-500"><use href="#icon-check"/></svg>'
              : '<svg class="size-5 text-gray-400 hover:text-gray-300"><use href="#icon-copy"/></svg>'
            }
          </button>
          <div id="${wrapperId}" style="display:none" onclick='
            const code = this.parentElement.querySelector("pre").textContent;
            navigator.clipboard.writeText(code).then(() => {
              const btn = this.parentElement.querySelector("button svg");
              btn.innerHTML = "<use href=\\"#icon-check\\"/>";
              btn.classList.add("text-green-500");
              btn.classList.remove("text-gray-400", "hover:text-gray-300");
              setTimeout(() => {
                btn.innerHTML = "<use href=\\"#icon-copy\\"/>";
                btn.classList.remove("text-green-500");
                btn.classList.add("text-gray-400", "hover:text-gray-300");
              }, 2000);
            });
          '></div>
          <pre><code class="${languageClass.trim()}">${code}</code></pre>
        </div>
      `
    }

    // Custom renderer for code blocks
    md.value.renderer.rules.fence = (tokens, idx) => {
      const token = tokens[idx]
      const info = token.info.trim()
      const code = token.content

      // Skip rendering if content is empty
      if (!code.trim()) return ''

      // Find the common indentation level
      const lines = code.split('\n')
      const nonEmptyLines = lines.filter(line => line.trim().length > 0)
      const indentLevels = nonEmptyLines.map(line => {
        const match = line.match(/^\s*/)
        return match ? match[0].length : 0
      })
      const indentLevel = indentLevels.length > 0 ? Math.min(...indentLevels) : 0

      // Split content into lines and find the actual code block
      const allLines = code.split('\n')
      let codeLines: string[] = []
      let inCode = true
      let hasSeenCode = false

      for (const line of allLines) {
        // Check for markdown fence ending
        if (line.trim().match(/^```\s*$/)) {
          inCode = false
          continue
        }

        // Skip if we've passed the code block
        if (!inCode) continue

        // Skip empty lines at the start
        if (!hasSeenCode && !line.trim()) continue

        // Process the line
        const processedLine = line.slice(Math.min(line.length, indentLevel))
        
        // Check if this is a code line or explanatory text
        const isComment = /^\s*[/#*-]+/.test(processedLine) // Regular comment
        const isExplanation = (
          (!isComment && /^[\s]*[A-Z][a-z]+\s+[a-z]+/.test(processedLine)) || // "This is an explanation"
          /^[\s]*#.*Ex:/.test(processedLine) || // "# ... Ex: ..." pattern
          /^[\s]*#.*\(.*\)/.test(processedLine) || // "# ... (explanation)"
          /^[\s]*[>]+\s*[A-Z]/.test(processedLine) || // "> Note: ..."
          /^[\s]*\[[A-Z][a-z]+\]/.test(processedLine) // "[Note] ..."
        )

        if (!isExplanation) {
          hasSeenCode = true
          codeLines.push(processedLine)
        }
      }

      // Clean up the code
      const cleanCode = codeLines
        .join('\n')
        .replace(/\n{3,}/g, '\n\n') // Replace multiple empty lines with double line break
        .trim()

      // Add language class for syntax highlighting
      const languageClass = info ? `language-${info}` : ''
      
      return addCopyButton(cleanCode, idx, languageClass)
    }

    md.value.use(highlightjs, {
      inline: true,
      auto: true,
      ignoreIllegals: true,
    })

    const content = computed(() => md.value.render(props.source))

    // Add SVG icons to the DOM
    const icons = `
      <svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
        <symbol id="icon-copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 4v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.242a2 2 0 0 0-.602-1.43L16.083 2.57A2 2 0 0 0 14.685 2H10a2 2 0 0 0-2 2z"/>
          <path d="M16 18v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2"/>
        </symbol>
        <symbol id="icon-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 6L9 17l-5-5"/>
        </symbol>
      </svg>
    `

    return () => h('div', { innerHTML: icons + content.value })
  },
})

export default Markdown
