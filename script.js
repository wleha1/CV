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
        this.move();
      }
    });
  }
 
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
        duration: 4000, 
        loop: true, 
        easing: "easeInOutSine", 
        translateX: [
          { value: anime.random(-5, 5), duration: anime.random(5000, 5000), easing: "easeInOutSine" }, 
          { value: anime.random(-5, 5), duration: anime.random(5000, 5000), easing: "easeInOutSine" } 
        ],
        translateY: [
          { value: anime.random(-5, 5), duration: anime.random(5000, 5000), easing: "easeInOutSine" }, 
          { value: anime.random(-5, 5), duration: anime.random(5000, 5000), easing: "easeInOutSine" } 
        ],
        direction: "alternate", 
        loop: true, 
        begin: function(anim) {
          
          layer.style.transform = 'translateX(0) translateY(0)';
        }
      });
    });
  }


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

  show() {
    setTimeout(() => this.intro(), 400);
  }
}

window.Blob = Blob;

const DOM = {};
let blobs = [];


Array.from($("svg.scene g")).forEach(el => {
  const blob = new Blob(el);
  blobs.push(blob);
  blob.intro();
});


DOM.links = Array.from($(".menu > .menu__item"));

DOM.links.forEach((link, pos) => {
  link.addEventListener("click", e => {
    e.preventDefault();
    open(pos);
  });
});


$(".content-close").click(() => close());

let current;


const open = pos => {


  current = pos;
  const currentBlob = blobs[current];

  currentBlob.expand();
  

  $(".menu").addClass("gone");


  $(".menu__item").each(function(){
    $(this).letterFade({
      fade: "out",
      duration: 30,
      delay: 0
    });
  });
  
 
  setTimeout(function(){
    $(".content").show(0);
    $(".content-close").fadeIn();
    
 
    $(".content__inner").eq(pos).show(0);
    
 
    $(".content__inner:visible .content__title").letterFade({
      fade: "in",
      duration: 30,
      delay: 0
    }, function(){
  
      $(".content__sub").delay(200).fadeIn();
    });
  }, 1200);


  blobs.filter(el => el != currentBlob).forEach(blob => blob.hide());
};


const close = () => {
  

  $(".content__inner:visible .content__title").letterFade({
    fade: "out",
    duration: 30,
    delay: 0
  }, function(){
  
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
      if (value.match(/\S/)) {  
        newstring +=
          '<span style="opacity: ' +
          opacity +
          '" class="blinky_' +
          ident +
          '">' +
          value +
          "</span>";
      } else {
        
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
