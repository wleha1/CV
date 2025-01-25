class Blob {
  constructor(el, options) {
    this.DOM = {};
    this.DOM.el = el;
    this.options = {};
    Object.assign(this.options, options);
    this.init();
  }
  init() {
    this.rect = this.DOM.el.getBoundingClientRect();
    this.descriptions = [];
    this.layers = Array.from(this.DOM.el.querySelectorAll("path"), t => {
      t.style.transformOrigin = `${this.rect.left +
        this.rect.width / 2}px ${this.rect.top + this.rect.height / 2}px`;
      t.style.opacity = 0;
      this.descriptions.push(t.getAttribute("d"));
      return t;
    });
  }
  // intro blob animation
  intro() {
    anime.remove(this.layers);
    anime({
      targets: this.layers,
      duration: 1800,
      delay: (t, i) => i * 120,
      easing: [0.2, 1, 0.1, 1],
      scale: [0.2, 1],
      opacity: {
        value: [0, 1],
        duration: 300,
        delay: (t, i) => i * 120,
        easing: "linear"
      },
      complete: () => {
        this.move(); // начинаем движение после завершения intro анимации
      }
    });
  }
  // expand blob animation
  expand() {
    return new Promise((resolve, reject) => {
      let halfway = false;
      anime({
        targets: this.layers,
        duration: 1000,
        delay: (t, i) => i * 50 + 200,
        easing: [0.8, 0, 0.1, 0],
        d: t => t.getAttribute("pathdata:id"),
        update: function(anim) {
          if (anim.progress > 75 && !halfway) {
            halfway = true;
            resolve();
          }
        }
      });
    });
  }

  move() {
    this.layers.forEach(layer => {
      anime({
        targets: layer,
        duration: 4000, // длительность одной итерации
        loop: true, // зацикленное движение
        easing: "easeInOutSine", // плавное движение
        translateX: [
          { value: anime.random(-5, 5), duration: anime.random(5000, 5000), easing: "easeInOutSine" }, // случайное движение влево/вправ
          { value: anime.random(-5, 5), duration: anime.random(5000, 5000), easing: "easeInOutSine" } // случайное движение влево/вправ
        ],
        translateY: [
          { value: anime.random(-5, 5), duration: anime.random(5000, 5000), easing: "easeInOutSine" }, // случайное движение вверх/вниз
          { value: anime.random(-5, 5), duration: anime.random(5000, 5000), easing: "easeInOutSine" } // случайное движение вверх/вниз
        ],
        direction: "alternate", // плавный возврат в начальное положение
        loop: true, // зацикленное движение
        begin: function(anim) {
          // Для более плавного начала, убираем рывки при первом запуске
          layer.style.transform = 'translateX(0) translateY(0)';
        }
      });
    });
  }

  // collapse blob animation
  collapse() {
    return new Promise((resolve, reject) => {
      let halfway = false;
      anime({
        targets: this.layers,
        duration: 800,
        delay: (t, i, total) => (total - i - 1) * 50 + 400,
        easing: [0.2, 1, 0.1, 1],
        d: (t, i) => this.descriptions[i],
        update: function(anim) {
          if (anim.progress > 75 && !halfway) {
            halfway = true;
            resolve();
          }
        }
      });
    });
  }
  // hide blob animation
  hide() {
    anime.remove(this.layers);
    anime({
      targets: this.layers,
      duration: 800,
      delay: (t, i, total) => (total - i - 1) * 80,
      easing: "easeInOutExpo",
      scale: 0,
      opacity: {
        value: 0,
        duration: 500,
        delay: (t, i, total) => (total - i - 1) * 80,
        easing: "linear"
      }
    });
  }
  // show blob animation
  show() {
    setTimeout(() => this.intro(), 400);
  }
}

window.Blob = Blob;

const DOM = {};
let blobs = [];

// do intro animation for all
Array.from($("svg.scene g")).forEach(el => {
  const blob = new Blob(el);
  blobs.push(blob);
  blob.intro();
});

// open according blob on link click
DOM.links = Array.from($(".menu > .menu__item"));

DOM.links.forEach((link, pos) => {
  link.addEventListener("click", e => {
    e.preventDefault();
    open(pos);
  });
});

// close blob on close click
$(".content-close").click(() => close());

let current;

// open function
const open = pos => {

  // set current blob
  current = pos;
  const currentBlob = blobs[current];

  currentBlob.expand();
  
  // add class "gone" to menu to animate :before's 
  $(".menu").addClass("gone");

  // fade menu letters out
  $(".menu__item").each(function(){
    $(this).letterFade({
      fade: "out",
      duration: 30,
      delay: 0
    });
  });
  
  // show content
  setTimeout(function(){
    $(".content").show(0);
    $(".content-close").fadeIn();
    
    // show according content
    $(".content__inner").eq(pos).show(0);
    
    // fade letters of title in
    $(".content__inner:visible .content__title").letterFade({
      fade: "in",
      duration: 30,
      delay: 0
    }, function(){
      // fade content in finally
      $(".content__sub").delay(200).fadeIn();
    });
  }, 1200);

  // trigger hide blob animation
  blobs.filter(el => el != currentBlob).forEach(blob => blob.hide());
};

// close function
const close = () => {
  
  // fade letters of title out
  $(".content__inner:visible .content__title").letterFade({
    fade: "out",
    duration: 30,
    delay: 0
  }, function(){
    // fade content out finally
    $(".content, .content__sub, .content__inner, .content-close").fadeOut();
  });
  
  setTimeout(function(){
    $(".menu").removeClass("gone");
    $(".menu__item").each(function() {
      $(this).letterFade({
        fade: "in",
        duration: 30,
        delay: 0
      });
    });
  }, 800);

  blobs[current].collapse();

  blobs.filter(el => el != blobs[current]).forEach(blob => blob.show());
};

// LETTERFADE.JS PLUGIN

$.fn.letterFade = function(options, complete) {
  var ident = Math.floor(Math.random() * 1000000);

  var settings = $.extend(
    {
      delay: 100,
      duration: 500,
      fade: "out"
    },
    options
  );

  var callback = function() {};

  if (typeof complete !== "undefined") {
    callback = complete;
  }

  return this.each(function() {
    var $this = $(this);
    var string = $this.text();
    var letters = string.split("");
    var newstring = "";
    var opacity = "0";

    if (settings.fade === "out") {
      opacity = "1.0";
    }

    $.each(letters, function(index, value) {
      if (value.match(/\S/)) {  // Обрабатываем только не пробельные символы
        newstring +=
          '<span style="opacity: ' +
          opacity +
          '" class="blinky_' +
          ident +
          '">' +
          value +
          "</span>";
      } else {
        // Для пробела просто добавляем его как есть
        newstring += value;
      }
    });

    $this.html(newstring);
    $this.show();

    setTimeout(function() {
      effect();
    }, settings.delay);

    var effect = function() {
      var source_opacity = 0;
      var target_opacity = 1;

      if (settings.fade === "out") {
        source_opacity = 1;
        target_opacity = 0;
      }

      var choices = $("span.blinky_" + ident).filter(function() {
        return $(this).css("opacity") == source_opacity;
      });

      if (choices.length === 0) callback();

      choices = shuffle(choices);

      $(choices[0]).fadeTo(settings.duration, target_opacity, function() {
        setTimeout(function() {
          effect();
        }, settings.delay);
      });
    };

    var shuffle = function(array) {
      for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
      }
      return array;
    };
  });
};
