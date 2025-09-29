// ----=  HANDS  =====
// 目标：最小、稳健的手指拖尾与捏合粒子效果实现

function prepareInteraction() {
  // 留作扩展（加载图片等），当前不需要实现
}

// 简洁的多层发光拖尾绘制器
function drawNeonTrail(trail, hex, speed) {
  if (!trail || trail.length < 2) return; // 没有足够点则退出
  const c = color(hex); // 将 hex 字符串转换为 p5 颜色对象
  const r = red(c), g = green(c), b = blue(c); // 从颜色对象中取出 RGB 分量
  const w = map(constrain(speed, 0, 40), 0, 40, 6, 16); // 将速度映射为线宽

  push(); // 保存当前绘图状态
  blendMode(ADD); // 使用叠加混合以产生发光效果
  noFill(); // 线条不填充
  stroke(r, g, b, 100); strokeWeight(w); // 外层发光颜色与粗细
  beginShape(); for (const p of trail) vertex(p.x, p.y); endShape(); // 绘制外层曲线
  stroke(r, g, b, 220); strokeWeight(max(2, w * 0.35)); // 内层更亮、更细
  beginShape(); for (const p of trail) vertex(p.x, p.y); endShape(); // 绘制内层曲线
  // 指尖光辉
  const tip = trail[trail.length - 1]; // 取轨迹最后一个点作为指尖
  noStroke(); // 指尖光晕不描边
  for (let s = 18; s >= 6; s -= 6) { // 画几个同心圆增强光晕
    fill(r, g, b, map(s, 6, 18, 220, 50)); ellipse(tip.x, tip.y, s, s); // 填充不同透明度的圆
  }
  blendMode(BLEND); // 恢复默认混合模式
  pop(); // 恢复绘图状态
}

// 主绘制函数（保持简单）
function drawInteraction(faces, hands) {
  if (!hands || !hands.length) return; // 无 hands 则直接返回

  // 全局状态（只创建一次）
  if (!window.__fx) {
    window.__fx = {
      themes: ['#60A5FA', '#C084FC', '#22D3EE', '#A3E635', '#FB7185', '#F59E0B', '#8B5CF6'], // 主题色数组
      themeIdx: 1, // 当前主题索引
      hands: { Left: {}, Right: {} }, // 按左右手保存每指状态
      particles: [] // 粒子数组
    };
  }
  const FX = window.__fx; // 局部引用，方便访问全局状态
  const fingerTips = ['thumb_tip','index_finger_tip','middle_finger_tip','ring_finger_tip','pinky_finger_tip']; // 要跟踪的指尖键名

  // 每只手
  for (let i = 0; i < hands.length; i++) {
    const hand = hands[i]; // 取得当前手对象
    if (!hand) continue; // 若为 undefined 则跳过

    // 可选：画骨架（若需要）
    if (typeof showKeypoints !== 'undefined' && showKeypoints && typeof connections !== 'undefined' && hand.keypoints) {
      drawConnections(hand); // 绘制骨架连线用于调试
    }

    // 左手食指控制主题色（简单映射）
    const tipForTheme = hand.index_finger_tip; // 食指 tip
    if (hand.handedness === 'Left' && tipForTheme) {
      const idx = floor(map(constrain(tipForTheme.y, 0, height), 0, height, 0, FX.themes.length)); // 根据 y 映射到主题索引
      FX.themeIdx = constrain(idx, 0, FX.themes.length - 1); // 限制索引合法范围
    }

    const label = (hand.handedness === 'Left' || hand.handedness === 'Right') ? hand.handedness : 'Right'; // 取左右手标签
    if (!FX.hands[label]) FX.hands[label] = {}; // 若不存在则创建对象

    // 每个手指处理：轨迹 + 捏合触发粒子
    for (const fk of fingerTips) {
      const tip = hand[fk]; // 取得当前指尖的坐标对象
      if (!tip) continue; // 若该指在当前帧不存在则跳过

      if (!FX.hands[label][fk]) FX.hands[label][fk] = { trail: [], last: null, pinchPrev: false }; // 初始化每指状态
      const state = FX.hands[label][fk]; // 状态引用

      // 速度估计
      let speed = 0; // 初始化速度
      if (state.last) { // 如果有上一帧位置
        const dx = tip.x - state.last.x, dy = tip.y - state.last.y; // 计算位移
        speed = sqrt(dx*dx + dy*dy); // 计算速度（像素/帧）
      }

      // 平滑插点并裁剪长度
      const lastP = state.trail[state.trail.length - 1]; // 取轨迹末尾点
      const nx = lastP ? lerp(lastP.x, tip.x, 0.6) : tip.x; // 用 lerp 平滑 x
      const ny = lastP ? lerp(lastP.y, tip.y, 0.6) : tip.y; // 用 lerp 平滑 y
      state.trail.push({ x: nx, y: ny }); // 将平滑后点加入轨迹
      const maxLen = floor(map(constrain(speed, 0, 40), 0, 40, 12, 48)); // 根据速度映射轨迹最大长度
      while (state.trail.length > maxLen) state.trail.shift(); // 超出长度则移除最早点

      // 捏合检测（拇指对其他指）
      let pinch = true; // 默认未捏合
      if (fk !== 'thumb_tip' && hand.thumb_tip) { // 如果不是拇指且拇指存在
        const d = dist(hand.thumb_tip.x, hand.thumb_tip.y, tip.x, tip.y); // 计算拇指到当前指尖距离
        pinch = d < 36; // 距离小于阈值视为捏合
      }
      if (pinch && !state.pinchPrev) { // 仅在刚发生捏合的一帧触发
        const col = FX.themes[FX.themeIdx]; // 使用当前主题色
        for (let n = 0; n < 20; n++) { // 生成若干粒子
          FX.particles.push({ x: tip.x, y: tip.y, vx: random(-2.5, 2.5), vy: random(-2.5, 2.5), life: 28, size: random(2.5,6), col }); // 粒子初始属性
        }
      }
      state.pinchPrev = pinch; // 更新上次捏合状态

      // 绘制轨迹与指尖点
      drawNeonTrail(state.trail, FX.themes[FX.themeIdx], speed); // 画拖尾，使用主题色与速度
      noStroke(); fill(255, 230, 120, 200); ellipse(tip.x, tip.y, 8, 8); // 在指尖画个小点便于对齐

      state.last = { x: tip.x, y: tip.y }; // 记录当前帧位置用于下一帧速度计算
    }
  }

  // 统一更新并绘制粒子
  for (let p = FX.particles.length - 1; p >= 0; p--) {
    const pt = FX.particles[p]; // 粒子引用
    pt.x += pt.vx; pt.y += pt.vy; pt.life -= 1; pt.vx *= 0.96; pt.vy *= 0.96; // 移动、衰减与阻尼
    const cc = color(pt.col); // 颜色对象
    noStroke(); fill(red(cc), green(cc), blue(cc), map(pt.life, 0, 28, 0, 220)); // 透明度随 life 缩小
    ellipse(pt.x, pt.y, pt.size, pt.size); // 绘制粒子
    if (pt.life <= 0) FX.particles.splice(p, 1); // 寿命耗尽从数组移除
  }
}

// 简单安全的 drawConnections（只绘制存在的 keypoints）
function drawConnections(hand) {
  if (!hand || !hand.keypoints || !connections) return; // 数据不全则返回
  push(); stroke(255, 0, 0); strokeWeight(2); // 设置线样式
  for (let j = 0; j < connections.length; j++) {
    const a = hand.keypoints[connections[j][0]]; // 取连接起点
    const b = hand.keypoints[connections[j][1]]; // 取连接终点
    if (!a || !b) continue; // 点不存在跳过该条连线
    line(a.x, a.y, b.x, b.y); // 绘制连线
  }
  pop(); // 恢复绘图状态
}

// 其它调试函数保留但不必要：drawPoints, fingerPuppet 等（可按需启用）


/*
说明 / 快速修改指南（放在文件末尾，便于阅读和二次修改）

全局数据结构（window.__fx）
- FX.themes: 颜色主题数组（hex 字符串），修改或增减颜色会影响拖尾与粒子的主题颜色。
- FX.themeIdx: 当前主题索引（0..themes.length-1），由左手食指上下控制。可以手动设置为默认颜色：FX.themeIdx = 0;
- FX.hands: 按左右手保存每个手指的状态对象，例如 FX.hands.Left.index_finger_tip = { trail: [], last: {x,y}, pinchPrev: false }
- FX.particles: 粒子数组，每个元素包含 { x, y, vx, vy, life, size, col }

重要参数（常改项）
- fingerTips: 要跟踪的手指名称列表（默认包含 thumb/index/middle/ring/pinky）。要禁用某个手指，把它从数组里移除。
- 平滑系数（插点）：lerp(last.x, tip.x, 0.6) 中的 0.6，数值越大轨迹越平滑但滞后越明显。
- 轨迹长度映射：const maxLen = floor(map(constrain(speed, 0, 40), 0, 40, 12, 48));
  - 将 12、48 改为更小/更大可以缩短或延长拖尾的最大长度。
- 捏合阈值：pinch = d < 36;  将 36 调大或调小可控制触发粒子的灵敏度。
- 粒子参数：生成时使用的数量（当前 20）、速度范围 random(-2.5,2.5)、寿命 life:28、size: random(2.5,6)。修改这些值可以改变视觉效果与性能。
- 拖尾粗细映射：drawNeonTrail 中的 map(constrain(speed,0,40), 0, 40, 6, 16) 控制最小到最大线宽。

如何调试与快速查看状态
- 在控制台打印全局状态：console.log(window.__fx) 或 console.log(FX)（在 drawInteraction 内使用）。
- 打开浏览器控制台查看错误和 console 输出。
- 如果拖尾看不到，确认：FX.themes 有值、drawNeonTrail 没被注释、trail 数组有点（console.log(state.trail.length)）。

常见修改示例
- 只跟踪食指：把 fingerTips 设为 ['index_finger_tip']。
- 减少粒子以提升性能：把 for (let n=0; n<20; n++) 改为 n<8。
- 改变主题控制为右手：把 if (hand.handedness === 'Left' && tipForTheme) 改为 'Right'。
- 让拖尾更紧贴手指：把 lerp 的 0.6 改为 0.3。

如何添加按手指不同颜色
- 在 FX.hands[label][fk] 增加 color 字段，例如在初始化时：
    FX.hands[label][fk] = { trail: [], last: null, pinchPrev: false, color: '#FF00AA' }
  然后在 drawNeonTrail 调用处改成： drawNeonTrail(state.trail, state.color || FX.themes[FX.themeIdx], speed);

注意事项
- 本脚本依赖 p5.js 的绘图环境（color, stroke, fill, beginShape, vertex 等），确保在 setup/draw 循环中运行。
- 如果模型在某些帧不返回部分 keypoints，代码会安全跳过这些点，但频繁缺失可能导致拖尾不连续。
- 为保证性能，避免把粒子数量和轨迹最大长度调得过大，尤其在弱设备上。

如果你想，我可以：
- 把上述注释中的一些参数抽成文件顶部的可配置常量，便于一次性修改；
- 或者按你的视觉偏好（颜色/速度/粒子形态）帮你调一套参数。
*/