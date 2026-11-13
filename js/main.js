/* 作品集交互脚本：懒加载 + 导航高亮 + 案例目录 + 大图灯箱 */
(function () {
  "use strict";

  // 1. 图片懒加载（滚动到可视区才加载）
  var lazyImgs = [].slice.call(document.querySelectorAll("img[data-src]"));
  if ("IntersectionObserver" in window && lazyImgs.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var img = e.target;
          img.src = img.getAttribute("data-src");
          img.onload = function () { img.classList.add("loaded"); };
          img.classList.add("loaded");
          io.unobserve(img);
        }
      });
    }, { rootMargin: "300px" });
    lazyImgs.forEach(function (img) {
      img.classList.add("lazy");
      io.observe(img);
    });
  } else if (lazyImgs.length) {
    lazyImgs.forEach(function (img) {
      img.src = img.getAttribute("data-src");
      img.classList.add("loaded");
    });
  }

  // 2. 当前页导航高亮（把 /dir/ 与 /dir/index.html 视为同一页）
  var links = document.querySelectorAll(".nav-links a");
  var normalizePath = function (path) {
    return path.replace(/\/index\.html$/, "/");
  };
  var current = normalizePath(location.pathname);
  links.forEach(function (a) {
    var target = normalizePath(new URL(a.href, location.href).pathname);
    if (target === current) a.classList.add("active");
  });

  // 3. 表格：把表头写进单元格，手机端卡片化时作为字段名
  [].slice.call(document.querySelectorAll(".rt")).forEach(function (table) {
    var headRow = table.tHead && table.tHead.rows[0];
    if (!headRow) return;
    var heads = [].map.call(headRow.cells, function (th) { return th.textContent.trim(); });
    [].forEach.call(table.tBodies, function (body) {
      [].forEach.call(body.rows, function (row) {
        [].forEach.call(row.cells, function (cell, i) {
          if (heads[i]) cell.setAttribute("data-label", heads[i]);
        });
      });
    });
  });

  // 4. 案例页：章节导航滚动高亮 + 阅读进度
  var caseNav = document.querySelector("[data-case-nav]");
  if (caseNav) {
    var spyLinks = [].slice.call(caseNav.querySelectorAll("a[data-spy]"));
    var progress = caseNav.querySelector("[data-case-progress]");
    var spySections = spyLinks.map(function (a) {
      return document.getElementById(a.getAttribute("data-spy"));
    }).filter(Boolean);

    // 页面正文在 #pageScroll 容器内滚动，window 本身不再滚动，
    // 所以这里要按容器计算，不能用 window.scrollY。
    var scroller = document.getElementById("pageScroll");
    var sTop = function () { return scroller ? scroller.scrollTop : window.scrollY; };
    var sMax = function () {
      return scroller
        ? scroller.scrollHeight - scroller.clientHeight
        : document.documentElement.scrollHeight - window.innerHeight;
    };
    var sBase = function () { return scroller ? scroller.getBoundingClientRect().top : 0; };

    var updateSpy = function () {
      var line = sTop() + 150;
      var currentSection = spySections[0];
      spySections.forEach(function (sec) {
        var top = sec.getBoundingClientRect().top - sBase() + sTop();
        if (top <= line) currentSection = sec;
      });
      spyLinks.forEach(function (a) {
        a.classList.toggle("is-active", currentSection && a.getAttribute("data-spy") === currentSection.id);
      });
      if (progress) {
        var max = sMax();
        var pct = max > 0 ? Math.min(1, Math.max(0, sTop() / max)) : 0;
        progress.style.width = (pct * 100).toFixed(2) + "%";
      }
    };

    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        updateSpy();
        ticking = false;
      });
    };
    (scroller || window).addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    updateSpy();
  }

  // 5. 大图灯箱
  var lb = document.querySelector("[data-lb]");
  if (lb) {
    var lbImg = lb.querySelector("[data-lb-img]");
    var closeBtn = lb.querySelector("[data-lb-close]");

    var openLb = function (src, alt) {
      lbImg.src = src;
      lbImg.alt = alt || "";
      lb.classList.add("is-open");
      lb.setAttribute("aria-hidden", "false");
      document.body.classList.add("lb-open");
    };
    var closeLb = function () {
      lb.classList.remove("is-open");
      lb.setAttribute("aria-hidden", "true");
      document.body.classList.remove("lb-open");
    };

    [].slice.call(document.querySelectorAll("[data-zoom]")).forEach(function (img) {
      img.addEventListener("click", function () {
        openLb(img.currentSrc || img.src, img.alt);
      });
    });

    lb.addEventListener("click", function (e) {
      if (e.target === lb || e.target === closeBtn || e.target.closest("[data-lb-close]")) closeLb();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lb.classList.contains("is-open")) closeLb();
    });
  }
})();
