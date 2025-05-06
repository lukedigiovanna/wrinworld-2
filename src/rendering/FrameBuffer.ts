class FrameBuffer {
    private framebuffer: WebGLFramebuffer | null = null;
    private _texture: WebGLTexture | null = null;
    private gl: WebGLRenderingContext;
    private _width: number;
    private _height: number;

    constructor(gl: WebGLRenderingContext, width: number, height: number) {
        this.gl = gl;
        this._width = width;
        this._height = height;
        this.initializeBufferAndTexture(width, height);
    }
    
    private initializeBufferAndTexture(width: number, height: number) {
        this.framebuffer = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
        this._texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this._texture);
        this.gl.texImage2D(
            this.gl.TEXTURE_2D, 0, this.gl.RGBA,
            width, height,
            0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null
          );
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
          
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this._texture, 0);
        
        const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
        if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
            console.error('Framebuffer not complete:', status.toString(16));
        }

        this._width = width;
        this._height = height;
    }

    public checkResize(width: number, height: number) {
        if (this._width === width && this._height === height) {
            return;
        }

        // Delete and recreate the old buffer/texture
        this.gl.deleteFramebuffer(this.framebuffer);
        this.gl.deleteTexture(this._texture);
        
        this.initializeBufferAndTexture(width, height);
    }

    public bind() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
    }

    public bindTexture() {
        this.gl.bindTexture(this.gl.TEXTURE_2D, this._texture);
    }

    public get width() {
        return this._width;
    }

    public get height() {
        return this._height;
    }

    public get texture() {
        return this._texture;
    }
}

export { FrameBuffer };
