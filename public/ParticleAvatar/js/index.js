/**
 * Created by donaldyu on 2018/5/4.
 * 参考链接: http://breathing-halftone.desandro.com/
 */
(function (window) {
    'use strict';

    class Halftone {
        constructor(img, options) {
            let self = this,
                defaults = {
                    dotSize: 1 / 40,
                    dotSizeThreshold: 0.05,
                    initVelocity: 0.02,
                    oscPeriod: 3,
                    oscAmplitude: 0.2,

                    isAdditive: false,
                    isRadial: false,
                    channels: ['red', 'green', 'blue'],

                    friction: 0.06,
                    hoverDiameter: 0.3,
                    hoverForce: -0.02,
                    activeDiameter: 0.6,
                    activeForce: 0.01
                };

            self.isActive = false;
            self.options = self.extend(defaults, options, true);
            self.img = img;

            self.create();
        }

        create() {
            let self = this,
                canvasAndCtx = self.createCanvas();

            //设置canvas开启活动状态
            self.isActive = true;
            self.canvas = canvasAndCtx.canvas;
            self.ctx = canvasAndCtx.ctx;
            self.canvas.className = self.img.className;
            self.insertNode(self.canvas, self.img);
            self.img.style.visibility = 'hidden';
            //每个channel每种color
            self.channels = !self.options.isAdditive ? ['lum'] : self.options.channels;
            self.proxyCanvas = {};

            //给每种color设置canvas
            for(let i = 0, len = self.channels.length; i < len; i++) {
                let channel = self.channels[i];
                self.proxyCanvas[channel] = self.createCanvas();
            }

            self.loadImage();
            self.canvasPosition = new Vector();
            self.getCanvasPosition();
            self.cursors = {};
        }

        /**
         * @method getCanvasPosition
         * @desc 获取canvas位置
         */
        getCanvasPosition() {
            let self = this,
                rect = this.canvas.getBoundingClientRect(),
                x = rect.left + window.pageXOffset,
                y = rect.top + window.pageYOffset;

            self.canvasPosition.set(x, y);
            self.canvasScale = self.width ? self.width / self.canvas.offsetWidth : 1;
        }

        /**
         * @method loadImage
         * @desc 初始化图片
         */
        loadImage() {
            let self = this,
                src = self.img.getAttribute('data-src') || self.img.src,
                imgObj = new Image();

            imgObj.onload = () => {
                self.onImgLoad();
            };
            imgObj.src = src;
            if(self.img.src !== src) {
                self.img.src = src;
            }
        }

        /**
         * @method onImgLoad
         * @desc 图片加载完成后进行的操作
         */
        onImgLoad() {
            let self = this;

            self.getImgData();
            self.resizeCanvas();
            self.img.style.display = 'none';
            self.getCanvasPosition();
            self.initParticles();
            self.animate();
        }

        /**
         * @method getImgData
         * @desc 获取图像像素信息
         */
        getImgData() {
            let self = this,
                canvasAndCtx = self.createCanvas(),
                imgCanvas = canvasAndCtx.canvas,
                ctx = canvasAndCtx.ctx;

            //获取图像原始宽高
            self.imgWidth = imgCanvas.width = self.img.naturalWidth;
            self.imgHeight = imgCanvas.height = self.img.naturalHeight;

            ctx.drawImage(self.img, 0, 0);
            self.imgData = ctx.getImageData(0, 0, self.imgWidth, self.imgHeight).data;
        }

        /**
         * @method resizeCanvas
         * @desc 调整canvas的大小
         */
        resizeCanvas() {
            let self = this;

            self.width = self.img.offsetWidth;
            self.height = self.img.offsetHeight;
            self.diagonal = Math.sqrt(self.width * self.width + self.height * self.height);
            self.imgScale = self.width / self.imgWidth;
            self.gridSize = self.options.dotSize * self.diagonal;

            //给每个channel的canvas对象设置宽高
            for(let prop in self.proxyCanvas) {
                self.proxyCanvas[prop].width = self.width;
                self.proxyCanvas[prop].height = self.height;
            }

            self.canvas.width = self.width;
            self.canvas.height = self.height;
        }

        /**
         * @method initParticles
         * @desc 初始化粒子数组
         */
        initParticles() {
            let self = this,
                //getRadialGridParticles 径向, getCartesianGridParticles 直角坐标系
                getParticlesMethod = self.options.isRadial ? 'getRadialGridParticles' : 'getCartesianGridParticles';

            self.particles = [];
            self.channelParticles = {};

            for(let i = 0, len = self.channels.length; i < len; i++) {
                let particles = self[getParticlesMethod](self.channels[i]);
                self.channelParticles[self.channels[i]] = particles;
                self.particles = self.particles.concat(particles)
            }
        }

        /**
         * @method initParticles
         * @desc 初始化直角坐标系粒子数组
         * @param {String} channel 颜色频道
         * @return {Array} 粒子数组
         */
        getCartesianGridParticles(channel) {
            let self = this,
                particles = [],
                cols = Math.ceil(self.diagonal / self.gridSize),
                rows = Math.ceil(self.diagonal / self.gridSize);

            for(let row = 0; row < rows; row++) {
                for(let col = 0; col < cols; col++) {
                    let x1 = col * gridSize,
                        y1 = row * gridSize;

                    let particle = self.initParticles(channel, x1, y1);

                    if(particle) {
                        particles.push(particle);
                    }
                }
            }
            return particles;
        }

        getRadialGridParticles(channel, angle) {
            let self = this,
                particles = []
        }

        /**
         * @method animate
         * @desc 执行动画的更新
         */
        animate() {
            let self = this;
            if(!self.isActive) {
                return;
            }

            self.update();
            self.render();
            requestAnimationFrame(self.animate.bind(this));
        }

        /**
         * @method extend
         * @desc 扩展target
         * @param target
         * @param extra
         * @param {Boolean} isDeep
         * @returns
         */
        extend(target, extra, isDeep) {
            for (let prop in extra) {
                let val = extra[prop];
                if (isDeep && typeof val === 'object' && Object.prototype.toString.call(val) === '[object Array]') {
                    target[prop] = extra(target[prop] || {}, val, true);
                }
                else {
                    target[prop] = val;
                }
            }

            return target;
        }

        /**
         * @method createCanvas
         * @desc 创建canvas对象
         * @returns {Object}
         */
        createCanvas() {
            let canvas = document.createElement('canvas'),
                ctx = canvas.getContext('2d');

            return {
                canvas,
                ctx
            }
        }

        /**
         * @method insertNode
         * @desc 插入节点
         * @param {Object} elem 要插入的dom
         * @param {Object} afterElem 目标节点
         * @returns {Object}
         */
        insertNode(elem, afterElem) {
            let parent = afterElem.parentNode;
            let nextElem = afterElem.nextElementSibling;
            if (nextElem) {
                parent.insertBefore(elem, nextElem);
            } else {
                parent.appendChild(elem);
            }
        }
    }

})(window);