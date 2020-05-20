import * as PIXI from '../libs/pixi'

(function() {
	var RichElement = function() {
		this._type = 0;
		this._tag = 0;
		this._opacity = 1;
		this._color = 0xFFFFFF;
	};
	RichElement.prototype.init = function(tag, color, opacity) {
		this._tag = tag;
		this._color = color;
		this._opacity = Math.min((typeof opacity === 'number' ? Math.max(0, opacity) : 1), 1);
	};

	var RichElementText = function(tag, colorOrFont, opacity, text, fontName, fontSize) {
		RichElement.call(this);
		this._type = RichElement.TEXT;
		this._text = "";
		this._fontName = "";
		this._fontSize = 0;
		if (typeof(colorOrFont) === "object")
			this.initWithStringAndTextDefinition(tag, text, colorOrFont, opacity);
		else
			fontSize && this.init(tag, colorOrFont, opacity, text, fontName, fontSize);
	};
	RichElementText.prototype = Object.create(RichElement.prototype);
	RichElementText.prototype.constructor = RichElement;

	RichElementText.prototype.init = function(tag, color, opacity, text, fontName, fontSize) {
		RichElement.prototype.init.call(this, tag, color, opacity);
		this._text = text;
		this._fontName = fontName;
		this._fontSize = fontSize;
	};

	RichElementText.prototype.initWithStringAndTextDefinition = function(tag, text, font, opacity) {
		RichElement.prototype.init.call(this, tag, font.fill, opacity);
		this._style = font;
		this._text = text;
		this._fontName = font.fontName;
		this._fontSize = font.fontSize;
	};

	var RichElementImage = function(tag, color, opacity, filePath) {
		RichElement.call(this);
		this._type = RichElement.IMAGE;
		this._filePath = "";
		this._textureRect = {
			x: 0,
			y: 0,
			width: 0,
			height: 0
		};

		filePath !== undefined && this.init(tag, color, opacity, filePath);
	};
	RichElementImage.prototype = Object.create(RichElement.prototype);
	RichElementImage.prototype.constructor = RichElement;

	RichElementImage.prototype.init = function(tag, color, opacity, filePath) {
		RichElement.prototype.init.call(this, tag, color, opacity);
		this._filePath = filePath;
	};

	var RichElementCustomNode = function(tag, color, opacity, customNode) {
		RichElement.call(this);
		this._type = RichElement.CUSTOM;
		this._customNode = null;

		customNode !== undefined && this.init(tag, color, opacity, customNode);
	};

	RichElementCustomNode.prototype = Object.create(RichElement.prototype);
	RichElementCustomNode.prototype.constructor = RichElement;
	RichElementCustomNode.prototype.init = function(tag, color, opacity, customNode) {
		RichElement.prototype.init.call(this, tag, color, opacity);
		this._customNode = customNode;
	};

	var RichText = function() {
		PIXI.Container.call(this);
		this._customSize = {
			width: 0,
			height: 0
		};
		this._formatTextDirty = false;
		this._richElements = [];
		this._elementRenders = [];
		this._leftSpaceWidth = 0;
		this._verticalSpace = 0;
		this._textHorizontalAlignment = "left";
		this._textVerticalAlignment = "top";
		this._wordWrap = true;
	};
	RichText.prototype = Object.create(PIXI.Container.prototype);
	RichText.prototype.constructor = PIXI.Container;

	RichText.prototype.setWordWrap = function(wordWrap) {
		this._wordWrap = !!wordWrap;
	};
	RichText.prototype.getWordWrap = function() {
		return this._wordWrap;
	};
	RichText.prototype.insertElement = function(element, index) {
		this._richElements.splice(index, 0, element);
		this._formatTextDirty = true;
	};
	RichText.prototype.pushBackElement = function(element) {
		this._richElements.push(element);
		this._formatTextDirty = true;
	};
	RichText.prototype.removeElement = function(element) {
		if (typeof element === 'number' || Object.prototype.toString.call(element) === '[object Number]')
			this._richElements.splice(element, 1);
		else
			this._richElements.splice(this._richElements.indexOf(element), 1);
		this._formatTextDirty = true;
	};
	RichText.prototype.formatText = function() {
		if (this._formatTextDirty) {
			this.removeChildren();
			this._elementRenders.length = 0;
			var i, element, locRichElements = this._richElements;
			this._addNewLine();
			if (!this._wordWrap) {
				for (i = 0; i < locRichElements.length; i++) {
					element = locRichElements[i];
					var elementRenderer = null;
					switch (element._type) {
						case RichElement.TEXT:
							var style = {};
							if (typeof(element._style) === "object") {
								style = element._style;
								var font = style.font;
								font && (style.font = (font.fontStyle || "normal") + " " + (font.fontWeight || "400") + " " + (font.fontSize || 36) + "px/" + (font.lineHeight || 1.1) + " " + (font.fontFamily || "Arial"));
							} else {
								style.font = "normal " + element._fontSize + "px" + " " + element._fontName;
							}
							style.fill = element._color;
							
							elementRenderer = new PIXI.Text(element._text, style);
							
							break;
						case RichElement.IMAGE:
							var texture = PIXI.Texture.fromImage(element._filePath),
								self = this;
							texture.on("update", function() {
								self._formatTextDirty = true;
							});
							elementRenderer = new PIXI.Sprite(texture);
							elementRenderer.tint = element._color;
							elementRenderer.anchor.y = 0.5;
							break;
						case RichElement.CUSTOM:
							elementRenderer = element._customNode;
							break;
						default:
							break;
					}
					elementRenderer.alpha = element._opacity;
					this._pushToContainer(elementRenderer);
				}
			} else {

				for (i = 0; i < locRichElements.length; i++) {
					element = locRichElements[i];
					switch (element._type) {
						case RichElement.TEXT:
							if (element._style)
								this._handleTextRenderer(element._text, element._style, element._style.fontSize, element._style.fill, element._opacity);
							else
								this._handleTextRenderer(element._text, element._fontName, element._fontSize, element._color, element._opacity);
							break;
						case RichElement.IMAGE:
							this._handleImageRenderer(element._filePath, element._color, element._opacity);
							break;
						case RichElement.CUSTOM:
							this._handleCustomRenderer(element._customNode);
							break;
						default:
							break;
					}
				}
			}
			this.formatRenderers();
			this._formatTextDirty = false;
		}
	};
	RichText.prototype._handleImageRenderer = function(filePath, color, opacity) {
		var texture = PIXI.Texture.fromImage(filePath),
			self = this;
		texture.on("update", function() {
			self._formatTextDirty = true;
		});
		var imageRenderer = new PIXI.Sprite(texture);
		imageRenderer.alpha = opacity;
		imageRenderer.tint = color;
		imageRenderer.anchor.y = 0.5;
		this._handleCustomRenderer(imageRenderer);
	};
	RichText.prototype._handleCustomRenderer = function(renderer) {
		var imgSize = {
			width: renderer.width,
			height: renderer.height
		};
		this._leftSpaceWidth -= imgSize.width;
		if (this._leftSpaceWidth < 0) {
			this._addNewLine();
			this._pushToContainer(renderer);
			this._leftSpaceWidth -= imgSize.width;
		} else
			this._pushToContainer(renderer);
	};
	RichText.prototype._handleTextRenderer = function(text, fontNameOrFont, fontSize, color, opacity) {
		if (text === "")
			return;
		if (text === "\n") {
			this._addNewLine();
			return;
		}
		var style = {};
		if (typeof(fontNameOrFont) === "object") {
			style = fontNameOrFont;
			style.font = (font.fontStyle || "normal") + " " + (font.fontWeight || "400") + " " + (font.fontSize || 36) + "px/" + (font.lineHeight || 1.1) + " " + (font.fontFamily || "Arial")
		} else {
			style.font = "normal " + fontSize + "px" + " " + fontNameOrFont;
		}
		style.fill = color;
		var textRenderer = new PIXI.Text(text, style);
		var textRendererWidth = textRenderer.width;
		this._leftSpaceWidth -= textRendererWidth;
		if (this._leftSpaceWidth < 0) {
			var overstepPercent = (-this._leftSpaceWidth) / textRendererWidth;
			var curText = text;
			var stringLength = curText.length;
			var leftLength = stringLength * (1 - overstepPercent);
			var leftWords = curText.substr(0, leftLength);
			var cutWords = curText.substr(leftLength, curText.length - 1);
			var validLeftLength = leftLength > 0;

			if (this._lineBreakOnSpace) {
				var lastSpaceIndex = leftWords.lastIndexOf(' ');
				leftLength = lastSpaceIndex === -1 ? leftLength : lastSpaceIndex + 1;
				cutWords = curText.substr(leftLength, curText.length - 1);
				validLeftLength = leftLength > 0 && cutWords !== " ";
			}

			if (validLeftLength) {
				var leftRenderer = null;
				if (typeof(fontNameOrFont) === "object") {
					leftRenderer = new PIXI.Text(leftWords.substr(0, leftLength), style);
				} else {
					leftRenderer = new PIXI.Text(leftWords.substr(0, leftLength), style);
				}
				leftRenderer.alpha = opacity;
				this._pushToContainer(leftRenderer);
			}

			this._addNewLine();
			this._handleTextRenderer(cutWords, fontNameOrFont, fontSize, color, opacity);
		} else {
			textRenderer.alpha = opacity;
			textRenderer.style.fill = color;
			this._pushToContainer(textRenderer);
		}
	};
	RichText.prototype._addNewLine = function() {
		this._leftSpaceWidth = this._width;
		this._elementRenders.push([]);
	};
	RichText.prototype.formatRenderers = function() {
		var newContentSizeHeight = 0;
		var locElementRenders = this._elementRenders;
		var i, j, row, nextPosX, l;
		var lineHeight, offsetX;
		if (!this._wordWrap) {
			var newContentSizeWidth = 0;
			row = locElementRenders[0];
			nextPosX = 0;
			for (j = 0; j < row.length; j++) {
				l = row[j];
                l.position.x = nextPosX;
                this.addChild(l);
                l._zIndex = 1;

                lineHeight = l.getLineHeight ? l.getLineHeight() : newContentSizeHeight;

                newContentSizeWidth += l.width;
                newContentSizeHeight = Math.max(Math.min(newContentSizeHeight, lineHeight), l.height);
                nextPosX += l.width;
			}
			if(this._textHorizontalAlignment !== "left") {
                offsetX = 0;
                if (this._textHorizontalAlignment === "right")
                    offsetX = this._width - nextPosX;
                else if (this._textHorizontalAlignment === "center")
                    offsetX = (this._width - nextPosX) / 2;

                for (j = 0; j < row.length; j++)
                    row[j].x += offsetX;
            }
		} else {
			var maxHeights = [];
			for (i = 0; i < locElementRenders.length; i++) {
				row = locElementRenders[i];
				var maxHeight = 0;
				for (j = 0; j < row.length; j++) {
					l = row[j];
					lineHeight = l.getLineHeight ? l.getLineHeight() : l.height;
					maxHeight = Math.max(Math.min(l.height, lineHeight), maxHeight);
				}
				maxHeights[i] = maxHeight;
				newContentSizeHeight += maxHeights[i];
			}
			var nextPosY = this.height;
			for (i = 0; i < locElementRenders.length; i++) {
				row = locElementRenders[i];
				nextPosX = 0;
				nextPosY += (maxHeights[i] + this._verticalSpace);

				for (j = 0; j < row.length; j++) {
					l = row[j];
					l.position.x = nextPosX;
					l.position.y = nextPosY;

					this.addChild(l);
					l._zIndex = 1;
					nextPosX += l.width;
				}
				if (this._textHorizontalAlignment !== "left" || this._textVerticalAlignment !== "top") {
					offsetX = 0;
					if (this._textHorizontalAlignment === "right")
						offsetX = this._width - nextPosX;
					else if (this._textHorizontalAlignment === "center")
						offsetX = (this._width - nextPosX) / 2;

					var offsetY = 0;
					if (this._textVerticalAlignment === "bottom")
						offsetY = this.height - newContentSizeHeight;
					else if (this._textVerticalAlignment === "center")
						offsetY = (this.height - newContentSizeHeight) / 2;
						
					for (j = 0; j < row.length; j++) {
						l = row[j];
						l.x += offsetX;
						l.y += offsetY;
					}
				}
			}
		}
		var length = locElementRenders.length;
		for (i = 0; i < length; i++) {
			locElementRenders[i].length = 0;
		}
		this._elementRenders.length = 0;
	};
	RichText.prototype._pushToContainer = function(renderer) {
		if (this._elementRenders.length <= 0)
			return;
		this._elementRenders[this._elementRenders.length - 1].push(renderer);
	};
	RichText.prototype._renderWebGL = function(renderer) {
		this.formatText();
	};
	RichText.prototype._renderCanvas = RichText.prototype._renderWebGL;

	RichElement.TEXT = 0;

	RichElement.IMAGE = 1;

	RichElement.CUSTOM = 2;

	PIXI.extras.RichElementImage = RichElementImage;
	PIXI.extras.RichElementText = RichElementText;
	PIXI.extras.RichText = RichText;
})();
