let stars = [];
let majorStars = [
  { name: "天狼星", x: 0.2, y: 0.3, size: 15, url: "https://ygao32958-cmd.github.io/0310/" },
  { name: "織女星", x: 0.7, y: 0.2, size: 12, url: "https://ygao32958-cmd.github.io/2026-0317/" },
  { name: "天津四", x: 0.85, y: 0.5, size: 10, url: "https://ygao32958-cmd.github.io/2026-0303/" },
  { name: "大角星", x: 0.15, y: 0.75, size: 14, url: "https://ygao32958-cmd.github.io/2026-0324-1/" },
  { name: "心宿二", x: 0.5, y: 0.85, size: 16, url: "https://ygao32958-cmd.github.io/2026-0407/" },
  { name: "北極星", x: 0.48, y: 0.1, size: 10, url: "https://ygao32958-cmd.github.io/0409/" }
];
let meteors = [];
let nebulas = [];
let satellites = [];
// 定義星座：包含名稱與連結的星星索引
let constellations = [
  { name: "夏季大三角 (Summer Triangle)", links: [[1, 2], [2, 5], [1, 5]] },
  { name: "南方星橋 (Southern Bridge)", links: [[0, 3], [3, 4]] },
  { name: "指極路徑 (Celestial Pointer)", links: [[2, 5], [5, 1]] }
];
let currentZoom = 1;
let signalStrength = 0;
const scopeSize = 300; // 望遠鏡視野大小

// 創意元素：數位雜訊種子
let noiseOffset = 0;

// 獲取 HTML 彈出視窗元素
let starPopupOverlay;
let popupStarName;
let popupIframe;

function setup() {
  createCanvas(windowWidth, windowHeight);
  // 禁用右鍵選單
  for (let element of document.getElementsByClassName("p5Canvas")) {
    element.addEventListener("contextmenu", (e) => e.preventDefault());
  }
  
  // 生成背景星雲 (增添色彩層次)
  for (let i = 0; i < 8; i++) {
    nebulas.push({
      x: random(1),
      y: random(1),
      r: random(300, 700),
      colorSeed: random(1000), // 為每片星雲提供獨立的色彩變換種子
      parallax: random(0.1, 0.3) // 視差強度，數值越大位移越明顯
    });
  }

  // 生成背景小星星
  for (let i = 0; i < 400; i++) {
    stars.push({
      x: random(1), // 使用比例座標 (0~1)
      y: random(1),
      size: random(1, 3),
      bright: random(100, 255),
      twinkleOffset: random(PI * 2),
      twinkleSpeed: random(0.02, 0.05)
    });
  }

  // 初始化人造衛星
  for (let i = 0; i < 2; i++) {
    satellites.push({
      x: random(width),
      y: random(height),
      speed: random(1, 2),
      angle: random(PI / 4)
    });
  }

  // 為主要大星星初始化閃爍參數
  for (let s of majorStars) {
    s.twinkleOffset = random(PI * 2);
    s.twinkleSpeed = random(0.01, 0.03); // 大星星閃爍較慢，顯得莊嚴
  }

  // 初始化 HTML 彈出視窗元素
  starPopupOverlay = select('#star-popup-overlay');
  popupStarName = select('#popup-star-name');
  popupIframe = select('#popup-iframe');
  let popupBackButton = select('#popup-back-button');

  // 為返回按鈕添加事件監聽器
  if (popupBackButton) {
    popupBackButton.mousePressed(hideStarPopup);
  }
  starPopupOverlay.style('display', 'none'); // 確保初始狀態是隱藏的
}

function draw() {
  background(5, 10, 20);

  // 處理縮放數值 (右鍵長按時放大)
  let targetZoom = (mouseIsPressed && mouseButton === RIGHT) ? 3.0 : 1;
  currentZoom = lerp(currentZoom, targetZoom, 0.15);

  // --- 第一步：繪製星空內容 ---
  push();
  // 以滑鼠為中心進行縮放
  translate(mouseX, mouseY);
  scale(currentZoom);
  translate(-mouseX, -mouseY);

  // --- 創意元素：星系連線與名稱顯示 ---
  for (let c of constellations) {
    // 計算星座的中心點，用來判定望遠鏡是否對準
    let totalX = 0, totalY = 0;
    let minY = height; // 紀錄星座中最上方的 Y 座標，用來放置標籤
    let starCount = 0;
    let processedIndices = new Set();
    for (let link of c.links) {
      processedIndices.add(link[0]);
      processedIndices.add(link[1]);
    }
    processedIndices.forEach(idx => {
      let sx = majorStars[idx].x * width;
      let sy = majorStars[idx].y * height;
      totalX += sx;
      totalY += sy;
      if (sy < minY) minY = sy; // 尋找該星群中垂直位置最高的點
      starCount++;
    });
    let centerX = totalX / starCount;
    let centerY = totalY / starCount;

    let d = dist(mouseX, mouseY, centerX, centerY);
    let alpha = map(d, 0, 180, 180, 0, true); // 縮小偵測半徑，避免名稱過早出現或重疊

    if (alpha > 0) {
      let pulse = (0.7 + 0.3 * sin(frameCount * 0.05));
      stroke(80, 180, 255, alpha * pulse * 0.6); // 降低連線亮度，避免擋住星星核心
      strokeWeight(0.8 / currentZoom);
      for (let link of c.links) {
        line(majorStars[link[0]].x * width, majorStars[link[0]].y * height, 
             majorStars[link[1]].x * width, majorStars[link[1]].y * height);
      }
      
      // 顯示星座名稱 (位置上移以避開星星名稱標籤)
      push();
      fill(130, 240, 255, alpha * pulse);
      noStroke();
      textAlign(CENTER);
      textSize(20 / currentZoom);
      text(c.name, centerX, minY - 40 / currentZoom); // 改以最上方星星為基準，確保不擋住大星星核心
      pop();
    }
  }

  // --- 創意元素：人造衛星 ---
  for (let sat of satellites) {
    sat.x += cos(sat.angle) * sat.speed;
    sat.y += sin(sat.angle) * sat.speed;
    if (sat.x > width) sat.x = -10;
    fill(255, frameCount % 20 < 10 ? 255 : 50); // 閃爍效果
    circle(sat.x, sat.y, 2);
  }

  // 畫背景星雲 (加入視差位移)
  for (let n of nebulas) {
    // 根據滑鼠相對於畫面中心的距離來計算偏移
    let offsetX = (mouseX - width / 2) * n.parallax;
    let offsetY = (mouseY - height / 2) * n.parallax;

    // 動態色彩變換：利用 noise 產生平滑流動感 (類似極光)
    let r = map(noise(n.colorSeed + frameCount * 0.005), 0, 1, 20, 60);
    let g = map(noise(n.colorSeed + 500 + frameCount * 0.005), 0, 1, 10, 40);
    let b = map(noise(n.colorSeed + 1000 + frameCount * 0.005), 0, 1, 60, 130);
    fill(r, g, b, 12); // 保持低透明度以疊加出層次感

    noStroke();
    circle(n.x * width + offsetX, n.y * height + offsetY, n.r);
  }

  // 畫背景小星星
  noStroke();
  for (let s of stars) {
    let wave = sin(frameCount * s.twinkleSpeed + s.twinkleOffset);
    let tBright = s.bright * (0.6 + 0.4 * wave);
    // 背景星星散光效果 (外層暈影)
    fill(255, tBright * 0.3);
    circle(s.x * width, s.y * height, s.size * (2.0 + wave * 0.5));
    // 星星核心
    fill(255, tBright);
    circle(s.x * width, s.y * height, s.size);
  }

  // 畫主要大星星
  for (let s of majorStars) {
    let sx = s.x * width;
    let sy = s.y * height;
    
    let mWave = sin(frameCount * s.twinkleSpeed + s.twinkleOffset);
    
    // 星球發光感 (三層散光效果)
    noStroke();
    fill(255, 255, 200, 40); // 最外層廣域散光
    circle(sx, sy, s.size * (4 + mWave * 1.5));
    fill(255, 255, 200, 100); // 中層暈光
    circle(sx, sy, s.size * (2 + mWave * 0.8));
    fill(255);
    circle(sx, sy, s.size); // 核心
    
    // 名字標籤 (名字不隨縮放變太大，稍微調整)
    textAlign(CENTER);
    textSize(14 / currentZoom); 
    fill(200);
    text(s.name, sx, sy + s.size + 15 / currentZoom);
  }

  // 處理與繪製流星
  if (random(1) < 0.01) { // 1% 機率產生流星
    meteors.push({
      x: random(width), y: random(height),
      vx: random(5, 10), vy: random(5, 10),
      life: 255,
      color: color(random(150, 255), random(200, 255), 255), // 為每顆流星分配一個亮麗的隨機色
      history: [] // 紀錄路徑以製作殘影
    });
  }
  for (let i = meteors.length - 1; i >= 0; i--) {
    let m = meteors[i];
    
    // 更新軌跡歷史
    m.history.push({x: m.x, y: m.y});
    if (m.history.length > 12) m.history.shift();
    
    // 使用原生 Canvas API 建立線性漸層
    let headX = m.x;
    let headY = m.y;
    let c = m.color;

    // 1. 空間扭曲效果 (Spatial Distortion) - 模擬震波環
    noFill();
    strokeWeight(1);
    stroke(red(c), green(c), blue(c), m.life * 0.1);
    circle(headX, headY, 15 + (255 - m.life) * 0.1); 
    stroke(red(c), green(c), blue(c), m.life * 0.05);
    circle(headX, headY, 25 + (255 - m.life) * 0.2);

    // 2. 拖尾殘影 (Trailing Afterimage) - 繪製歷史路徑
    for (let j = 0; j < m.history.length - 1; j++) {
      let p1 = m.history[j];
      let p2 = m.history[j+1];
      let alpha = map(j, 0, m.history.length, 0, m.life * 0.6);
      stroke(red(c), green(c), blue(c), alpha);
      strokeWeight(map(j, 0, m.history.length, 1, 4));
      line(p1.x, p1.y, p2.x, p2.y);
    }

    let tailX = m.x - m.vx * 12; // 增加尾巴長度係數
    let tailY = m.y - m.vy * 12;

    let grad = drawingContext.createLinearGradient(headX, headY, tailX, tailY);
    // 設定漸層點：從頭部（亮色 + 當前生命值透明度）到尾部（完全透明）
    grad.addColorStop(0, `rgba(${red(c)}, ${green(c)}, ${blue(c)}, ${m.life / 255})`);
    grad.addColorStop(1, `rgba(${red(c)}, ${green(c)}, ${blue(c)}, 0)`);

    drawingContext.strokeStyle = grad;
    strokeWeight(2);
    line(headX, headY, tailX, tailY);

    m.x += m.vx; m.y += m.vy;
    m.life -= 5;
    if (m.life <= 0) meteors.splice(i, 1);
  }
  pop();

  // --- 第二步：製作望遠鏡遮罩 ---
  // 使用「超粗圓環法」：畫一個巨大的黑色空心圓，邊框粗到足以遮住螢幕其餘部分
  push();
  noFill();
  stroke(0); 
  let thickness = max(width, height) * 1.5; // 確保厚度蓋住全螢幕
  strokeWeight(thickness);
  circle(mouseX, mouseY, scopeSize + thickness);
  pop();

  // --- 第三步：繪製金屬鏡框 ---
  drawTelescopeFrame(mouseX, mouseY, scopeSize);

  // --- 第四步：繪製專業十字準星與刻度 ---
  drawReticle(mouseX, mouseY, scopeSize);

  // --- 第五步：繪製數位座標顯示 ---
  drawHUD(mouseX, mouseY);
}

function drawTelescopeFrame(x, y, diameter) {
  push();
  noFill();
  
  // 1. 內側模糊陰影 (讓邊緣看起來不那麼銳利)
  drawingContext.shadowBlur = 15;
  drawingContext.shadowColor = 'black';
  stroke(20, 20, 25);
  strokeWeight(5);
  circle(x, y, diameter);
  
  // 2. 金屬鏡框主體
  drawingContext.shadowBlur = 0; // 關閉陰影以畫精細線條
  stroke(80, 85, 90); // 冷灰色金屬
  strokeWeight(8);
  circle(x, y, diameter + 4);
  
  // 3. 鏡框高光 (增加立體感)
  stroke(150, 155, 160);
  strokeWeight(1.5);
  circle(x, y, diameter + 8);
  pop();
}

function drawReticle(x, y, d) {
  push();
  stroke(255, 50, 50, 150); // 專業感紅色準星
  strokeWeight(1);
  noFill();

  // 中央圓圈
  circle(x, y, 40);
  circle(x, y, 2);

  // 十字長線 (不穿透中心圓)
  line(x, y - d/2, x, y - 30); // Top
  line(x, y + 30, x, y + d/2); // Bottom
  line(x - d/2, y, x - 30, y); // Left
  line(x + 30, y, x + d/2, y); // Right

  // 周圍度數刻度
  stroke(200, 200, 200, 100);
  for (let a = 0; a < TWO_PI; a += PI/12) {
    let x1 = x + cos(a) * (d/2 - 5);
    let y1 = y + sin(a) * (d/2 - 5);
    let x2 = x + cos(a) * (d/2 - 15);
    let y2 = y + sin(a) * (d/2 - 15);
    line(x1, y1, x2, y2);
  }

  // 方位標示
  fill(255, 100, 100);
  noStroke();
  textSize(12);
  textAlign(CENTER, CENTER);
  text("N", x, y - d/2 + 25);
  fill(200);
  text("S", x, y + d/2 - 25);
  text("E", x + d/2 - 25, y);
  text("W", x - d/2 + 25, y);
  pop();
}

function drawHUD(x, y) {
  push();
  fill(0, 200, 0, 180); // 數位綠
  textFont('monospace');
  textSize(12);
  textAlign(LEFT);
  let zoomText = currentZoom.toFixed(1) + "X";
  
  // 更新訊號強度 (靠近大星星時增強)
  let maxD = 1000;
  for (let s of majorStars) {
    let d = dist(mouseX, mouseY, (s.x * width - mouseX) * currentZoom + mouseX, (s.y * height - mouseY) * currentZoom + mouseY);
    maxD = min(maxD, d);
  }
  signalStrength = lerp(signalStrength, map(maxD, 0, 200, 100, 0, true), 0.1);

  text("ZOOM: " + zoomText, x + scopeSize/2 + 20, y - 20);
  text("RA: " + nf(map(x, 0, width, 0, 24), 2, 2) + "h", x + scopeSize/2 + 20, y);
  text("DEC: " + nf(map(y, 0, height, 90, -90), 2, 2) + "°", x + scopeSize/2 + 20, y + 20);
  
  // 訊號強度條
  noFill();
  stroke(0, 200, 0, 100);
  rect(x + scopeSize/2 + 20, y + 35, 60, 5);
  fill(0, 200, 0, 200);
  rect(x + scopeSize/2 + 20, y + 35, map(signalStrength, 0, 100, 0, 60), 5);
  
  // 放大時的數位掃描線效果
  if (currentZoom > 1.1) {
    stroke(0, 200, 0, 30);
    for (let i = -scopeSize/2; i < scopeSize/2; i += 4) {
      line(x - scopeSize/2, y + i, x + scopeSize/2, y + i);
    }
    
    // 數位噪點干擾效果
    if (random(1) < 0.05) {
      stroke(0, 255, 0, 50);
      let ry = y + random(-scopeSize/2, scopeSize/2);
      line(x - scopeSize/2, ry, x + scopeSize/2, ry + random(-5, 5));
    }
  }
  pop();
}

function mousePressed() {
  if (mouseButton === LEFT) {
    for (let s of majorStars) {
      let sx = s.x * width;
      let sy = s.y * height;
      
      // 因為縮放中心是滑鼠，所以點擊判定相對單純
      let d = dist(mouseX, mouseY, (sx - mouseX) * currentZoom + mouseX, (sy - mouseY) * currentZoom + mouseY);
      
      if (d < s.size * currentZoom) {
        showStarPopup(s);
        return; // 點擊到一個星星後就停止檢查
      }
    }
  }
}

// 顯示星星資訊彈出視窗
function showStarPopup(starData) {
  if (starPopupOverlay && popupStarName && popupIframe) {
    popupStarName.html(starData.name);
    popupIframe.attribute('src', starData.url); // 直接設定 iframe 來源
    starPopupOverlay.style('display', 'flex'); // 顯示彈出視窗
  }
}

// 隱藏星星資訊彈出視窗
function hideStarPopup() {
  if (starPopupOverlay && popupIframe) {
    starPopupOverlay.style('display', 'none'); // 隱藏彈出視窗
    popupIframe.attribute('src', 'about:blank'); // 關閉時清空內容，節省效能並停止視窗內的音效
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
