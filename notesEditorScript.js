const { ipcRenderer, ipcMain } = require('electron')

document.execCommand('styleWithCSS', false, true)
ipcRenderer.invoke('checkDir')




// ELEMENTS

let toolButtons = document.querySelectorAll('.toolButton')
let fontSelector = document.getElementById('fonts')
let fontSizeSelector = document.getElementById('fontSize')
let foregroundInput = document.getElementById('foregroundInput')
let backgroundInput = document.getElementById('backgroundInput')
let imageInputButton = document.getElementById('insertImageButton')

let saveAsButton = document.getElementById('saveAsButton')
let saveButton = document.getElementById('saveButton')
let openFileButton = document.getElementById('openFileButton')


let canvas = document.getElementById('canvas')
let conspectName = document.getElementById('conspectName')
let categoryName = document.getElementById('categoryName')

let navigationPanel = document.getElementById('navigationPanel')




// VARIABLES

const defaultName = 'Новый конспект'
const defaultCategory = 'Категория без названия'

let selectedConspect = {
    Name: defaultName,
    Category: defaultCategory
}




// SET DEFAULT VALUES

conspectName.value = selectedConspect.Name
categoryName.value = selectedConspect.Category



// BUTTONS CLICKS

toolButtons.forEach(button => {
    button.addEventListener('click', () => {
        document.execCommand(button.dataset['command'], false, button.dataset['param'])
    })
})

fontSelector.addEventListener('change', () => {
    const selectedIndex = fontSelector.selectedIndex
    const selectedFont = fontSelector.options[selectedIndex].value
    document.execCommand('fontName', false, selectedFont)
})
fontSizeSelector.addEventListener('change', () => {
    const selectedIndex = fontSizeSelector.selectedIndex
    const selectedSize = fontSizeSelector.options[selectedIndex].value
    document.execCommand('fontSize', false, selectedSize)
})
foregroundInput.addEventListener('input', () => {
    document.execCommand('foreColor', false, foregroundInput.value)
})
backgroundInput.addEventListener('input', () => {
    document.execCommand('hiliteColor', false, backgroundInput.value)
})
insertImageButton.addEventListener('click', () => {
    ipcRenderer.invoke('openImage')
})

saveAsButton.addEventListener('click', () => {
    ipcRenderer.invoke('saveFileAs', canvas.innerHTML)
})

conspectName.addEventListener('input', () => {
    selectedConspect.Name = conspectName.value
})

categoryName.addEventListener('input', () => {
    selectedConspect.Category = categoryName.value
})

saveButton.addEventListener('click', () => {
    ipcRenderer.invoke('saveConspect', selectedConspect.Category, selectedConspect.Name, canvas.innerHTML)
})

openFileButton.addEventListener('click', () => {
    ipcRenderer.invoke('openFile')
})

ipcRenderer.on('navigationHtml', (e, navigationHtml) => {
    navigationPanel.innerHTML = navigationHtml

    document.querySelectorAll('.conspectButton').forEach(button => {
        conspectButtonClickListener(button)
    })

    addCategoryButtonClickListener()
    deleteCategoryButtonClickListener()

    addConspectButtonClickListener()
    deleteConspectButtonClickListener()
})

function conspectButtonClickListener(button) {
    button.addEventListener('click', () => {
        selectedConspect.Name = button.dataset['name']
        selectedConspect.Category = button.dataset['category']

        ipcRenderer.invoke('openConspect', selectedConspect.Category, selectedConspect.Name)
    })
}



function addCategoryButtonClickListener() {
    document.getElementById('addCategoryButton').addEventListener('click', () => {
        showAddCategoryPanel(true)

        addCategory_SaveButtonClickListener()
        addCategory_CancelButtonClickListener()
    })
}

function deleteCategoryButtonClickListener() {
    document.querySelectorAll('.deleteCategoryButton').forEach(button => {
        button.addEventListener('click', () => {
            ipcRenderer.invoke('deleteCategory', button.dataset['category'])

            if (button.dataset['category'] == selectedConspect.Category) {
                resetSelectedConspect()
            }
        })
    })
}

function addCategory_CancelButtonClickListener() {
    document.getElementById('addCategory_CancelButton').addEventListener('click', () => {
        showAddCategoryPanel(false)

        addCategoryButtonClickListener()
    })
}

function addCategory_SaveButtonClickListener() {
    document.getElementById('addCategory_SaveButton').addEventListener('click', () => {
        const addCategoryInput = document.getElementById('addCategoryInput')
        if (addCategoryInput == null || addCategoryInput.value.trim() == '') {
            console.log('incorrect name')
            return
        }

        ipcRenderer.invoke('addCategory', addCategoryInput.value.trim())


        showAddCategoryPanel(false)

        addCategoryButtonClickListener()
    })
}



function addConspectButtonClickListener() {
    document.querySelectorAll('.addConspectButton').forEach(button => {
        button.addEventListener('click', () => {
            showAddConspectPanel(true, button.dataset['category'])

            addConspect_SaveButtonClickListener()
            addConspect_CancelButtonClickListener()
        })
    })
}

function deleteConspectButtonClickListener() {
    document.querySelectorAll('.deleteConspectButton').forEach(button => {
        button.addEventListener('click', () => {
            ipcRenderer.invoke('deleteConspect', button.dataset['category'], button.dataset['name'])

            if (button.dataset['name'] == selectedConspect.Name) {
                resetSelectedConspect()
            }
        })
    })
}

function addConspect_CancelButtonClickListener() {
    document.querySelectorAll('.addConspect_CancelButton').forEach(button => {
        button.addEventListener('click', () => {
            showAddConspectPanel(false, button.dataset['category'])
    
            addConspectButtonClickListener()
        })
    })
}

function addConspect_SaveButtonClickListener() {
    document.querySelectorAll('.addConspect_SaveButton').forEach(button => {
        button.addEventListener('click', () => {
            let addConspectInput
            let newConspectCategory = button.dataset['category']
            document.querySelectorAll('.addConspectInput').forEach(input => {
                if (input.dataset['category'] == newConspectCategory) {
                    addConspectInput = input
                }
            })

            let newConspectName = addConspectInput.value.trim()

            if (addConspectInput == null || newConspectName == '') {
                console.log('incorrect name')
                return
            }
    
            ipcRenderer.invoke('addConspect', newConspectCategory, newConspectName)
            
    
            showAddConspectPanel(false, newConspectCategory)
    
            addConspectButtonClickListener()

            canvas.innerHTML = ''

            
            console.log(selectedConspect)
            conspectName.value = selectedConspect.Name = newConspectName
            categoryName.value = selectedConspect.Category = newConspectCategory
        })
    })
}




// IPC

ipcRenderer.on('setCanvasData', (e, fileContent) => {
    canvas.innerHTML = fileContent
    conspectName.value = selectedConspect.Name
    categoryName.value = selectedConspect.Category
})

ipcRenderer.on('insertImage', (e, imagePath) => {
    document.execCommand('insertImage', false, imagePath)

    const images = canvas.getElementsByTagName('img')
    for (const img of images) {
        img.style.maxWidth = 95 + '%'
    }
})




// FUNCTIONS

function showAddCategoryPanel(showPanel) {
    if (showPanel) {
        document.getElementById('addCategoryPanel').innerHTML = '<div id="addCategory"><input id="addCategoryInput"></input><br /><div id="addCategoryButtons"><button class="addCategoryButton" id="addCategory_SaveButton">Сохранить</button><button class="addCategoryButton" id="addCategory_CancelButton">Отмена</button></div></div>'
    } else {
        document.getElementById('addCategoryPanel').innerHTML = '<button id="addCategoryButton"><i class="fa fa-add"></i><p>Добавить<br />категорию</p></button>'
    }
}

function showAddConspectPanel(showPanel, category) {
    if (showPanel) {
        document.querySelectorAll('.addConspectPanel').forEach(panel => {
            if (panel.dataset['category'] == category) {
                panel.innerHTML = `<div class="addConspect"><input class="addConspectInput" data-category="${category}"></input><br /><div class="addConspectButtons"><button class="addConspect_SaveButton" data-category="${category}">Сохранить</button><button class="addConspect_CancelButton" data-category="${category}">Отмена</button></div></div>`
            }
        })
    } else {
        document.querySelectorAll('.addConspectPanel').forEach(panel => {
            if (panel.dataset['category'] == category) {
                panel.innerHTML = `<button class="addConspectButton" data-category="${category}"><i class="fa fa-add"></i><p>Новый конспект</p></button>`
            }
        })
    }
}

function resetSelectedConspect() {
    conspectName.value = selectedConspect.Name = defaultName
    categoryName.value = selectedConspect.Category = defaultCategory
    canvas.innerHTML = ''
}