(function($) {
	$.fn.typewriter = function() {
		this.each(function() {
			var $ele = $(this), str = $ele.html(), progress = 0;
			$ele.html('');
			var timer = setInterval(function() {
        var current = str.substr(progress, 1);
				if (current == '<') {
					progress = str.indexOf('>', progress) + 1;
				} else {
					progress++;
        }
        $ele.html(str.substring(0, progress) + (progress & 1 ? '_' : ''));
				if (progress >= str.length) {
          clearInterval(timer);
          $ele.html($ele.html().substr(0, $ele.html().length - 1));
          window.dispatchEvent(new Event('startAnimation'));
				}
			}, 200);
		});
		return this;
	};
})(jQuery);

$('#letter').typewriter();

const FOCUS_POSITION = 1200;
const SPRING = 0.01;
const FRICTION = 0.9;

class PARTICLE {

  // x,y,z 为当前的坐标，vx,vy,vz 则是3个方向的速度
  constructor(center) {
    this.center = center;
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    this.nextX = 0;
    this.nextY = 0;
    this.nextZ = 0;
  }

  // 设置这些粒子需要运动到的终点(下一个位置)
  setAxis(axis) {
    this.nextX = axis.x;
    this.nextY = axis.y;
    this.nextZ = axis.z;
    this.color = axis.color;
  }

  step() {
    // 弹力模型 距离目标越远速度越快
    this.vx += (this.nextX - this.x) * SPRING;
    this.vy += (this.nextY - this.y) * SPRING;
    this.vz += (this.nextZ - this.z) * SPRING;
    // 摩擦系数 让粒子可以趋向稳定
    this.vx *= FRICTION;
    this.vy *= FRICTION;
    this.vz *= FRICTION;

    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;
  }

  getAxis2D() {
    this.step();
    // 3D 坐标下的 2D 偏移，暂且只考虑位置，不考虑大小变化
    const scale = FOCUS_POSITION / (FOCUS_POSITION + this.z);
    return {
      x: this.center.x + this.x * scale,
      y: this.center.y - this.y * scale
    };
  }
}

const lineHeight = 7;
const praticle_count = 1500;

function color(color) {
  return `hsla(${color.h},${color.s},${color.l},${color.a})`;
}

const ArcCanvas = {};

function createArcCanvas(color) {
  const arcCanvas = document.createElement('canvas');
  const arcCanvasCtx = arcCanvas.getContext('2d');
  arcCanvas.setAttribute('width', 40);
  arcCanvas.setAttribute('height', 40);
  arcCanvasCtx.fillStyle = color;
  arcCanvasCtx.arc(20, 20, 20, 0, 2 * Math.PI);
  arcCanvasCtx.fill();
  ArcCanvas[color] = arcCanvas;
}

class Scene {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.draw = this.draw.bind(this);
    this.init(width, height);
  }

  init(width, height) {
    this.width = width;
    this.height = height;
    this.center = {
      x: width / 2,
      y: height / 2
    };
    this.geometrys = [];
    this.activeGeometry = null;
    this.tick = 0;
    this.actionIndex = -1;
    this.particles = [];
    for (let i = 0; i < praticle_count; i++) {
      this.particles.push(new PARTICLE(this.center));
    }
    this.clear();
    cancelAnimationFrame(this.raf);
  }

  clear() {
    this.ctx.fillStyle = 'rgba(255, 247, 240,0.3)';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  build(t) {
    this.actions = t;
    this.geometrys = this.actions.map(t => t.func ? t.func : this.buildGeometry(t.texts));
    if (this.geometrys.length) {
      this.nextAction();
    }
  }

  buildGeometry(t) {
    const i = []; let e = ''; t.forEach(t => { e += t.text }); const s = [+!+[] + !+[]] + [+[]] + [+[]] | 0, h = ~~(s * this.height / this.width), n = document.createElement('canvas'), a = n.getContext('2d'); n.setAttribute('width', s), n.setAttribute('height', h), a.fillStyle = '#000', a.font = 'bold 10px Arial'; const c = a.measureText(e), r = Math.min(.8 * h * 10 / lineHeight, .8 * s * 10 / c.width); a.font = `bold ${r}px Arial`; const o = a.measureText(e); let x = (s - o.width) / 2; const l = (h + r / 10 * lineHeight) / 2; return Object.values(t).forEach(t => { a.clearRect(0, 0, s, h), a.fillText(t.text, x, l), x += a.measureText(t.text).width; const e = a.getImageData(0, 0, s, h), n = []; for (let t = 0, i = e.width * e.height; t < i; t++)e.data[4 * t + 3] && n.push({ x: t % e.width / e.width, y: t / e.width / e.height }); i.push({ color: t.hsla, points: n }) }), i
  }

  nextAction() {
    this.actionIndex++;
    if (this.actionIndex >= this.actions.length) {
      this.actionIndex = 0;
    }
    this.activeGeometry = this.geometrys[this.actionIndex];
    this.tick = 0;
    this.setParticle();
  }

  setParticle() {
    const t = this.activeGeometry.length;
    this.particles.forEach((particle, index) => {
      let s = this.activeGeometry[index % t];
      let h = s.points[~~(Math.random() * s.points.length)];
      particle.setAxis({
        x: h.x * canvasWidth - this.center.x,
        y: (1 - h.y) * canvasHeight - this.center.y,
        z: ~~(30 * Math.random()),
        color: s.color
      });
    });
  }

  renderParticles() {
    this.particles.forEach(particle => {
      const axis = particle.getAxis2D();
      const hsla = color(particle.color);
      ArcCanvas[hsla] || createArcCanvas(hsla);
      this.ctx.drawImage(ArcCanvas[hsla], axis.x - 2, axis.y - 2, 4, 4);
    })
  }

  draw() {
    this.tick++;
    if (this.tick >= this.actions[this.actionIndex].lifeTime) {
      this.nextAction();
    }
    this.clear();
    this.renderParticles();
    this.raf = requestAnimationFrame(this.draw);
  }
}

var canvas, ctx, canvasWidth, canvasHeight, scene, img;

function load() {
  canvas = document.querySelector('#mycanvas');
  ctx = canvas.getContext('2d');
  reset();
  scene = new Scene(ctx, canvasWidth, canvasHeight);
  scene.build(Actions);
  scene.draw();
  window.addEventListener('resize', reset);
}

function reset() {
  // canvasWidth = window.innerWidth;
  // canvasHeight = window.innerHeight;
  canvasWidth = canvas.clientWidth;
  canvasHeight = canvas.clientHeight;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = canvasWidth * ratio;
  canvas.height = canvasHeight * ratio;
  ctx.scale(ratio, ratio);
  if (scene) {
    scene.init(canvasWidth, canvasHeight);
    scene.build(Actions);
    scene.draw();
  }
}

window.addEventListener('startAnimation', load);
