import { App, MarkdownView, Plugin, debounce, Editor, Modal, MarkdownRenderer } from "obsidian"
import { ReadingTimeSettingsTab, ReadingTimeSettings, RT_DEFAULT_SETTINGS } from "./settings"
import { readingTimeText } from "./helpers"
export default class ReadingTime extends Plugin {
  settings: ReadingTimeSettings
  statusBar: HTMLElement

  async onload() {
    await this.loadSettings();

    this.statusBar = this.addStatusBarItem()
    this.statusBar.setText("")

    this.addSettingTab(new ReadingTimeSettingsTab(this.app, this))

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'reading-time-editor-command',
			name: 'Selected Text',
			editorCallback: (editor: Editor, view: MarkdownView) => {
        new ReadingTimeModal(this.app, editor, this).open();
			}
		});

    this.registerEvent(
      this.app.workspace.on("file-open", debounce(this.calculateReadingTime, 500, true))
    )

    this.registerEvent(
      this.app.workspace.on("layout-change", this.calculateReadingTime)
    )

    this.registerEvent(
      this.app.workspace.on("editor-change", debounce(this.calculateReadingTime, 1000))
    )
    console.log("Loaded Reading Time plugin - SK")
  }

  calculateReadingTime = async () => {

    const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
    
    if (mdView && mdView.getViewData()) {
      // create a new div element for the rendered markdown
      const el = document.createElement("div");
      const rendered = await MarkdownRenderer.render(this.app, mdView?.getViewData() || "", el, this.app.workspace.getActiveFile().path, mdView);
      
      // console.log(rendered);
      // console.log(el);
      // expand Collection to a string with a space in between each item's text
      const boldWords = Array.from(el.getElementsByTagName('strong')).map(x => x.innerText).join(' ');
      // console.log( boldWords );
    
      const result = readingTimeText(el.innerText, this)
      const boldWordsResult = readingTimeText(boldWords, this)
      this.statusBar.setText(`${result} B:${boldWordsResult}`)
    } else {
      this.statusBar.setText("0 min read")
    }
    // }
  }

	async loadSettings() {
		this.settings = Object.assign({}, RT_DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class ReadingTimeModal extends Modal {

  plugin: ReadingTime;
  editor: Editor;

  constructor(app: App, editor: Editor, plugin: ReadingTime) {
    super(app);
    this.editor = editor;
    this.plugin = plugin;
	}

	onOpen() {
		const {contentEl, titleEl} = this;
    titleEl.setText('Reading Time of Selected Text');
    const stats = readingTime(this.editor.getSelection(), this.plugin);
		contentEl.setText(`${stats} (at ${this.plugin.settings.readingSpeed} wpm)`);
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}