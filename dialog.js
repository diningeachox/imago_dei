function wrapText(context, text, x, y, maxWidth, lineHeight) {
    var words = text.split(' ');
    var line = '';

    for(var n = 0; n < words.length; n++) {
        var testLine = line + words[n] + ' ';
        var metrics = context.measureText(testLine);
        var testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        }
        else {
            line = testLine;
        }
    }
    context.fillText(line, x, y);
}


class Dialog {
    constructor(ctx, x, y, width, height, message='', face=-1){
        this.ctx = ctx;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.message = message;
        this.face = face;
    }

    setMessage(text, face){
        this.message = text;
        this.face = face;
    }

    render(){
        this.ctx.fillStyle = 'rgba(100, 149, 237, 0.85)';
        this.ctx.fillRect(this.x, this.y, this.width, this.height);
        //face
        var im_width = Math.min(this.ctx.canvas.width / 10, this.ctx.canvas.height / 3 * 2);
        this.ctx.drawImage(images[this.face], this.x + 20, this.y + 10, im_width, im_width);

        //Name/title
        this.ctx.textAlign = "center";
        this.ctx.font="13px Verdana";
        this.ctx.fillStyle = "white";
        var name = titles[this.face].split('\n');
        this.ctx.fillText(name[0], this.x + 20 + im_width / 2, this.y + 10 + im_width+ 15, im_width + 20);
        this.ctx.fillText(name[1], this.x + 20 + im_width / 2, this.y + 10 + im_width + 30, im_width + 30);

        //Message
        this.ctx.textAlign = "left";
        this.ctx.font="18px myFont";
        this.ctx.fillStyle = "white";
        var x_offset = this.x + 10 + im_width + 30;
        var y_offset = this.y + 30;
        wrapText(this.ctx, this.message, x_offset, y_offset, this.width - x_offset, 20);
    }

}
