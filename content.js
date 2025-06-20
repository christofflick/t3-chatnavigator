// Create and inject the sidebar
function createSidebar() {
  const sidebar = document.createElement('div')
  sidebar.className = 't3-chat-sidebar hidden p-4 border-l border-chat-border'
  sidebar.style.backgroundColor = 'hsl(var(--background))'
  sidebar.innerHTML = `
    <div class="t3-chat-sidebar-header border-b border-chat-border px-3 pb-2 mb-3">
      <div class="t3-chat-sidebar-title" style="color:var(--wordmark-color)">Your Messages</div>
      <button class="t3-chat-sidebar-close" aria-label="Close sidebar" style="color:var(--wordmark-color)">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x size-4">
          <path d="M18 6 6 18"></path>
          <path d="m6 6 12 12"></path>
        </svg>
      </button>
    </div>
    <div class="t3-chat-message-list flex flex-col gap-1"></div>
  `
  document.body.appendChild(sidebar)

  // Add close button functionality
  const closeButton = sidebar.querySelector('.t3-chat-sidebar-close')
  closeButton?.addEventListener('click', () => {
    sidebar.classList.add('hidden')
    // Update the main button state
    const mainButton = document.querySelector('.t3-chat-sidebar-button')
    if (mainButton) {
      mainButton.classList.remove('bg-muted/40')
    }
  })

  return sidebar
}

// Create and inject the sidebar toggle button
function createSidebarButton() {
  const buttonGroup = document.querySelector(
    '.fixed.right-2.top-2.z-20.max-sm\\:hidden'
  )
  if (!buttonGroup) {
    return null
  }

  // Check if button already exists
  if (buttonGroup.querySelector('.t3-chat-sidebar-button')) {
    return buttonGroup.querySelector('.t3-chat-sidebar-button')
  }

  const buttonContainer = buttonGroup.querySelector(
    '.flex.flex-row.items-center.bg-gradient-noise-top'
  )
  if (!buttonContainer) {
    return null
  }

  const sidebarButton = document.createElement('button')
  sidebarButton.className =
    't3-chat-sidebar-button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-muted/40 hover:text-foreground disabled:hover:bg-transparent disabled:hover:text-foreground/50 size-8'
  sidebarButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square size-4">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
    <span class="sr-only">Toggle message history</span>
  `

  buttonContainer.appendChild(sidebarButton)
  return sidebarButton
}

// Initialize the sidebar and button
const sidebar = createSidebar()
const messageList = sidebar.querySelector('.t3-chat-message-list')

// Create button and add toggle functionality
let sidebarButton = null
function initializeButton() {
  sidebarButton = createSidebarButton()
  if (sidebarButton) {
    // Remove any existing click listeners
    const newButton = sidebarButton.cloneNode(true)
    sidebarButton.parentNode.replaceChild(newButton, sidebarButton)
    sidebarButton = newButton

    sidebarButton.addEventListener('click', () => {
      sidebar.classList.toggle('hidden')
      // Update button appearance based on sidebar state
      sidebarButton.classList.toggle('bg-muted/40')
    })
  }
}

// Watch for button group changes
const buttonGroupObserver = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    if (mutation.type === 'childList') {
      // Check if our button was removed
      const buttonGroup = document.querySelector(
        '.fixed.right-2.top-2.z-20.max-sm\\:hidden'
      )
      if (
        buttonGroup &&
        !buttonGroup.querySelector('.t3-chat-sidebar-button')
      ) {
        initializeButton()
      }
    }
  })
})

// Start observing the button group
function startButtonGroupObserving() {
  const buttonGroup = document.querySelector(
    '.fixed.right-2.top-2.z-20.max-sm\\:hidden'
  )
  if (buttonGroup) {
    buttonGroupObserver.observe(buttonGroup, {
      childList: true,
      subtree: true
    })
    initializeButton()
  } else {
    // If button group isn't found, try again after a short delay
    setTimeout(startButtonGroupObserving, 200)
  }
}

// Start button group observer
startButtonGroupObserving()

// Watch for URL changes
let lastUrl = location.href
new MutationObserver(() => {
  const currentUrl = location.href
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl
    // Clear existing messages immediately when URL changes
    messageList.innerHTML = ''

    // If we're on the root URL, show no messages and return
    if (currentUrl === 'https://t3.chat/' || currentUrl === 'https://t3.chat') {
      showNoMessages()
      return
    }

    // Add a small delay to ensure the new chat content is loaded
    setTimeout(() => {
      // Initialize messages for new chat
      initializeMessages(0)
      // Re-initialize button
      startButtonGroupObserving()
    }, 500)
  }
}).observe(document, { subtree: true, childList: true })

// Function to show no messages state
function showNoMessages() {
  messageList.innerHTML = `
    <div class="flex items-center justify-center p-4 text-sm text-muted-foreground">
      No messages in this chat yet
    </div>
  `
}

// Function to get all messages
function getAllMessages() {
  return Array.from(document.querySelectorAll('[data-message-id].justify-end'))
}

// Function to clear and update messages
function updateMessages() {
  // Get all messages for current chat
  const messages = getAllMessages()
  console.log(messages)

  if (messages.length === 0) {
    showNoMessages()
    return
  }

  // Only add new messages that haven't been processed
  let hasNewMessages = false
  messages.forEach(message => {
    if (!message.dataset.processed) {
      message.dataset.processed = 'true'
      addMessageToSidebar(message)
      hasNewMessages = true
    }
  })

  // If no new messages were added and the sidebar is empty, show all messages
  if (!hasNewMessages && messageList.children.length === 0) {
    messages.forEach(message => {
      if (!message.dataset.processed) {
        message.dataset.processed = 'true'
        addMessageToSidebar(message)
      }
    })
  }
}

// Function to initialize messages with retry
function initializeMessages(retryCount = 0) {
  const currentUrl = location.href
  // If we're on the root URL, show no messages and return
  if (currentUrl === 'https://t3.chat/' || currentUrl === 'https://t3.chat') {
    console.log('No messages')
    showNoMessages()
    return
  }

  const messages = getAllMessages()

  if (messages.length === 0 && retryCount < 10) {
    // Increased retry count
    // If no messages found and haven't exceeded retry limit, try again with exponential backoff
    const retryDelay = Math.min(200 * Math.pow(2, retryCount), 2000) // Exponential backoff up to 2 seconds
    setTimeout(() => initializeMessages(retryCount + 1), retryDelay)
    return
  }

  // Clear processed state from all messages
  messages.forEach(message => {
    delete message.dataset.processed
  })

  // If we still have no messages after all retries, show the no messages state
  if (messages.length === 0) {
    showNoMessages()
    return
  }

  updateMessages()
}

// Function to highlight the active message
function highlightActiveMessage(messageElement) {
  // Remove highlight from all messages
  document.querySelectorAll('.t3-chat-message-item').forEach(item => {
    item.classList.remove('bg-sidebar-accent', 'text-sidebar-accent-foreground')
  })

  // Find and highlight the corresponding sidebar item
  const messageId = messageElement.closest('[data-message-id].justify-end')
    ?.dataset.messageId
  if (messageId) {
    const sidebarItem = document.querySelector(
      `.t3-chat-message-item[data-message-id="${messageId}"].justify-end`
    )
    if (sidebarItem) {
      sidebarItem.classList.add(
        'bg-sidebar-accent',
        'text-sidebar-accent-foreground'
      )
    }
  }
}

function cleanMessageContent(messageContent) {
  return messageContent.replace(/<[^>]*>?/g, '').slice(0, 200)
}

// Function to add a message to the sidebar
function addMessageToSidebar(messageElement) {
  const messageContent = messageElement.querySelector('.prose').textContent
  const imageElement = messageElement.querySelector('img[alt="Attached image"]')
  const hasImage = imageElement !== null
  const messageId = messageElement.closest('[data-message-id].justify-end')
    ?.dataset.messageId

  if (!messageId) return

  const messageItem = document.createElement('div')
  messageItem.className =
    't3-chat-message-item group/link relative flex h-9 w-full items-center overflow-hidden rounded-lg px-2 py-1 text-sm outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring hover:focus-visible:bg-sidebar-accent cursor-pointer'
  messageItem.dataset.messageId = messageId

  messageItem.innerHTML = `
    <div class="flex items-center gap-2 w-full">
      <div class="t3-chat-message-content h-full flex-1 rounded bg-transparent px-1 py-1 text-sm text-muted-foreground outline-none overflow-hidden truncate">${cleanMessageContent(
        messageContent
      )}</div>
      ${
        hasImage
          ? `
        <div class="flex-shrink-0 text-muted-foreground relative group/image" data-image-preview="${imageElement.src}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
            <circle cx="9" cy="9" r="2"/>
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
          </svg>
        </div>
      `
          : ''
      }
    </div>
  `

  // Add click handler to scroll to the message
  messageItem.addEventListener('click', () => {
    const targetMessage = document.querySelector(
      `[data-message-id="${messageId}"].justify-end`
    )

    if (targetMessage) {
      // Use scrollIntoView with smooth behavior
      targetMessage.scrollIntoView({
        behavior: 'smooth',
        block: 'center' // Center the message in the viewport
      })

      // Highlight the message
      highlightActiveMessage(messageElement)
    }
  })

  // Append the message instead of prepending it
  messageList.appendChild(messageItem)
}

// Create a MutationObserver to watch for new messages
let updateTimeout
const observer = new MutationObserver(mutations => {
  let shouldUpdate = false

  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        // Check for new messages using data-message-id
        const messages = node.querySelectorAll('[data-message-id].justify-end')
        if (messages.length > 0) {
          shouldUpdate = true
        }
      }
    })
  })

  if (shouldUpdate) {
    // Debounce updates to prevent multiple rapid updates
    clearTimeout(updateTimeout)
    updateTimeout = setTimeout(() => {
      updateMessages()
    }, 100)
  }
})

// Start observing the chat container
function startObserving(retryCount = 0) {
  const chatContainer = document.querySelector(
    '.absolute\\.inset-0\\.overflow-y-scroll\\.sm\\:pt-3\\.5'
  )
  if (chatContainer) {
    observer.observe(chatContainer, {
      childList: true,
      subtree: true
    })
    // Initialize messages after observer is set up
    initializeMessages(retryCount)
  } else {
    // If chat container isn't found, try again with increasing delays
    const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000) // Exponential backoff up to 5 seconds
    setTimeout(() => startObserving(retryCount + 1), retryDelay)
  }
}

// Initialize the observer
startObserving(0)

// Initial message load
initializeMessages(0)

// Create and manage the tooltip element
let tooltip = null
function createTooltip() {
  if (!tooltip) {
    tooltip = document.createElement('div')
    tooltip.style.zIndex = '999999'
    tooltip.className =
      'fixed bg-background border w-32 h-32 border-border rounded-md shadow-lg p-1 hidden'
    tooltip.innerHTML =
      '<img src="" alt="Preview" class="w-32 h-32 object-cover object-center rounded" />'
    document.body.appendChild(tooltip)
  }
  return tooltip
}

// Add tooltip event listeners
function setupTooltipListeners() {
  const tooltip = createTooltip()
  const tooltipImg = tooltip.querySelector('img')

  document.addEventListener('mouseover', e => {
    const imagePreview = e.target.closest('[data-image-preview]')
    if (imagePreview) {
      const rect = imagePreview.getBoundingClientRect()
      const imageUrl = imagePreview.dataset.imagePreview

      tooltipImg.src = imageUrl
      tooltip.style.left = `${rect.left - 138}px`
      tooltip.style.top = `${rect.top}px`
      tooltip.classList.remove('hidden')
      tooltip.classList.add('block')
    }
  })

  document.addEventListener('mouseout', e => {
    const imagePreview = e.target.closest('[data-image-preview]')
    if (imagePreview) {
      tooltip.classList.remove('block')
      tooltip.classList.add('hidden')
    }
  })

  // Add click handler for opening image in new tab
  document.addEventListener('click', e => {
    const imagePreview = e.target.closest('[data-image-preview]')
    if (imagePreview) {
      e.preventDefault()
      e.stopPropagation()
      const imageUrl = imagePreview.dataset.imagePreview
      window.open(imageUrl, '_blank')
    }
  })
}

// Initialize tooltip listeners
setupTooltipListeners()
