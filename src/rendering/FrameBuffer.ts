class FrameBuffer {
    private framebuffer: WebGLFramebuffer | null = null;
    private texture: WebGLTexture | null = null;
    private gl: WebGLRenderingContext;
    private canvas: HTMLCanvasElement;
    private width?: number;
    private height?: number;

    constructor(gl: WebGLRenderingContext, canvas: HTMLCanvasElement) {
        this.gl = gl;
        this.canvas = canvas;
        this.initializeBufferAndTexture();
    }
    
    private initializeBufferAndTexture() {
        this.framebuffer = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
        this.texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.texImage2D(
            this.gl.TEXTURE_2D, 0, this.gl.RGBA,
            this.canvas.width, this.canvas.height,
            0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null
          );
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
          
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.texture, 0);
        
        const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
        if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
            console.error('Framebuffer not complete:', status.toString(16));
        }

        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    public checkResize() {
        if (this.width === this.canvas.width && this.height === this.canvas.height) {
            return;
        }

        // Delete and recreate the old buffer/texture
        this.gl.deleteFramebuffer(this.framebuffer);
        this.gl.deleteTexture(this.texture);
        
        this.initializeBufferAndTexture();
    }

    public bind() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
    }

    public bindTexture() {
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    }
}

export { FrameBuffer };
