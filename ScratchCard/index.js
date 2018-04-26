/**
 * Created by donaldyu on 2018/4/24.
 * 刮刮卡demo
 * 参考链接: https://www.w3cplus.com/canvas/compositing.html
 * globalAlpha: 设置图像的透明度, 这个值必须设置在图形绘制之前
 * globalCompositeOperation: 把图像源和目标图像进行混合
 */
;(function () {
    window.addEventListener('load', canvasHandler, false);

    function canvasHandler() {
        let canvas = document.getElementById('card-main'),
            ctx = canvas.getContext('2d'),
            card = document.getElementById('card'),
            width = card.offsetWidth,
            height = card.offsetHeight,
            brush = new Image(),
            isBrushing = false,
            startPoint = { x: 0, y: 0 };

        canvas.width = width;
        canvas.height = height;

        //跨域, 无内容解析为anonymous, <img>，<video>，<script>支持CORS(Cross-Origin Resource Sharing)（跨域资源共享）的属性
        brush.crossOrigin = '';
        brush.src = './img/brush.png';

        //第一步监听鼠标或者触摸按下事件
        canvas.addEventListener('mousedown', mouseDown, false);
        canvas.addEventListener('touchstart', mouseDown, false);

        //第二步监听鼠标或者触摸移动事件
        canvas.addEventListener('mousemove', mouseMove, false);
        canvas.addEventListener('touchmove', mouseMove, false);

        //第三步监听焦点消失或者取消触屏事件
        canvas.addEventListener('mouseup', mouseUp, false);
        canvas.addEventListener('touchend', mouseUp, false);

        //第四步监听焦点离开区域事件
        canvas.addEventListener('mouseout', mouseUp, false);
        canvas.addEventListener('touchleave', mouseUp, false);


        //记录刷子的状态以及起始点坐标
        function mouseDown(event) {
            isBrushing = true;
            startPoint = getPoint(event, canvas);
        }

        //记录刷子的状态以及起始点坐标
        function mouseMove(event) {
            //如果从区域外移动至区域内则视为无效
            if(!isBrushing) {
                return;
            }

            let currentPoint = getPoint(event, canvas),
                distance = distanceBetween(startPoint, currentPoint),
                angle = angleBetween(startPoint, currentPoint),
                x = 0,
                y = 0;

            for(let i = 0; i < distance; i++) {
                //按照角度设置绘制的轨迹, 25为刷子的偏移距离
                x = startPoint.x + Math.sin(angle) * i - 25;
                y = startPoint.y + Math.cos(angle) * i - 25;

                ctx.globalCompositeOperation = 'destination-out';
                ctx.drawImage(brush, x, y);
            }

            startPoint = currentPoint;
            handlePercentage(getFilledInPixels(32));
        }

        //停止刷子的动作
        function mouseUp() {
            isBrushing = false;
        }

        //获取焦点坐标
        function getPoint(event, canvas) {
            let offsetX = 0,
                offsetY = 0;

            //获取canvas的偏移距离
            do {
                offsetX += canvas.offsetLeft;
                offsetY += canvas.offsetTop;
            }
            while((canvas = canvas.offsetParent));

            return {
                x: (event.pageX || event.touches[0].clientX) - offsetX,
                y: (event.pageY || event.touches[0].clientY) - offsetY
            }
        }

        //获取平面上两点之间的距离
        function distanceBetween(startPoint, currentPoint) {
            return Math.sqrt(Math.pow(currentPoint.x - startPoint.x, 2) + Math.pow(currentPoint.y - startPoint.y, 2));
        }

        //获取从X轴逆时针旋转至(x, y)的辐射角度
        function angleBetween(startPoint, currentPoint) {
            return Math.atan2(currentPoint.x - startPoint.x, currentPoint.y - startPoint.y);
        }

        //对保留涂层的百分比处理
        function handlePercentage(fillesInPixels) {
            fillesInPixels = fillesInPixels || 0;

            //如果刷子覆盖的区域面积总和大于40%则完全显示背景
            if(fillesInPixels > 40) {
                canvas.parentNode.removeChild(canvas);
            }
        }

        //获取刷子刷出的区域的百分比
        function getFilledInPixels(stride) {
            //getImageData获取图片完整的像素信息
            let pixels = ctx.getImageData(0, 0, width, height),
                pixelData = pixels.data,
                pixelLength = pixelData.length,
                total = pixelLength / stride,
                count = 0;

            for (let i = 0; i < pixelLength; i += stride) {
                if (parseInt(pixelData[i]) === 0) {
                    count++;
                }
            }

            return Math.round((count / total) * 100);
        }

        //初始化时添加遮罩层
        (function () {
            ctx.save();
            ctx.fillStyle = '#ddd';
            ctx.fillRect(0, 0, width - 2, height - 2);
            ctx.restore();
        })();
    }
})();