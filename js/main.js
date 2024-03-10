function setText(elem, text, speed) {
    // Обращаемся к элементу
    var e = document.querySelector(elem);
  
    // Устанавливаем начальную позицию
    var i = 0,
    // Создаём интервал
        int = setInterval(function() {
          // Если позиция равна количеству символов в тексте, то удаляем интервал
          if(i == text.length){
            clearInterval(int);
          };
          // Устанавливаем значение для textarea
          e.innerHTML = text.substr(0,i); // Текст от начала до текущей позиции
          // Прибавляем +1 к позиции
          i++;
        }, speed);
        
    // Для фокуса
    // e.focus();
    // e.onblur = function() { clearInterval(int) };
};
function deleteText(elem, speed) {
    // Обращаемся к элементу
    var e = document.querySelector(elem);
  
    // Устанавливаем начальную позицию
    var i = e.innerHTML.length,
    // Создаём интервал
        int = setInterval(function() {
          // Если позиция равна количеству символов в тексте, то удаляем интервал
          if(i <= 0){
            clearInterval(int);
          };
          // Устанавливаем значение для textarea
          e.innerHTML = e.innerHTML.substr(0,i); // Текст от начала до текущей позиции
          // Прибавляем +1 к позиции
          i--;
        }, speed);
        
    // Для фокуса
    // e.focus();
    // e.onblur = function() { clearInterval(int) };
};

window.addEventListener('load',function(){
setTimeout(function(){
    // Выравниваем по вертикали везитку
    let main_el = document.querySelector(".content__main-window");
    main_el.style.top = (document.body.clientHeight - main_el.clientHeight)/2 + "px";
    main_el.style.left = (document.body.clientWidth - main_el.clientWidth)/2 + "px";

    // обработка и изменение стилей кнопок подвала
    let all_nav_obj = document.querySelectorAll(".buttons-navigation object");
    let btn_nav = document.querySelectorAll(".btn-nav");
    let btn_nav_wrap = document.querySelectorAll(".btn-nav__wrapper");
    
    let arr_svg_nav = [
        document.getElementById("btn_1").contentDocument.querySelector("svg"), 
        document.getElementById("btn_2").contentDocument.querySelector("svg"), 
        document.getElementById("btn_3").contentDocument.querySelector("svg"), 
        document.getElementById("btn_4").contentDocument.querySelector("svg")
    ];
    for(let i = 0; i < arr_svg_nav.length; i++){
        if(arr_svg_nav[i].id == "btn_1"){
            arr_svg_nav[i].style.fill = "none";
            arr_svg_nav[i].style.stroke = "black";
        }
        if(arr_svg_nav[i].id == "btn_2"){
            arr_svg_nav[i].style.fill = "none";
            arr_svg_nav[i].style.stroke = "white";
        }
        if(arr_svg_nav[i].id == "btn_3"){
            arr_svg_nav[i].style.fill = "white";
            arr_svg_nav[i].style.stroke = "none";
        }
        if(arr_svg_nav[i].id == "btn_4"){
            arr_svg_nav[i].style.fill = "white";
            arr_svg_nav[i].style.stroke = "none";
        }
    }

    for(let i = 0; i < all_nav_obj.length; i++){
        all_nav_obj[i].style.top = (btn_nav[i].clientHeight - all_nav_obj[i].clientHeight)/2 + "px";

        btn_nav_wrap[i].onclick = () => {
            // обработка и изменение стилей кнопок подвала
            let btn_nav = document.querySelectorAll(".btn-nav");
            
            for(let j = 0; j < all_nav_obj.length; j++){
                btn_nav[j].classList.remove("selected");

                if(j == 0){
                    let el_svg = btn_nav[j].querySelector("object").contentDocument.querySelector("svg")
                    el_svg.style.fill="none";
                    el_svg.style.stroke="white";
                }
                if(j == 1){
                    let el_svg = btn_nav[j].querySelector("object").contentDocument.querySelector("svg")
                    el_svg.style.fill="none";
                    el_svg.style.stroke="white";
                }
                if(j == 2){
                    let el_svg = btn_nav[j].querySelector("object").contentDocument.querySelector("svg")
                    el_svg.style.fill="white";
                    el_svg.style.stroke="none";
                }
                if(j == 3){
                    let el_svg = btn_nav[j].querySelector("object").contentDocument.querySelector("svg")
                    el_svg.style.fill="white";
                    el_svg.style.stroke="none";
                }
            }

            btn_nav[i].classList.add("selected");

            if(i == 0){
                let el_svg = btn_nav[i].querySelector("object").contentDocument.querySelector("svg")
                el_svg.style.fill="none";
                el_svg.style.stroke="black";
            }
            if(i == 1){
                let el_svg = btn_nav[i].querySelector("object").contentDocument.querySelector("svg")
                el_svg.style.fill="none";
                el_svg.style.stroke="black";
            }
            if(i == 2){
                let el_svg = btn_nav[i].querySelector("object").contentDocument.querySelector("svg")
                el_svg.style.fill="black";
                el_svg.style.stroke="none";
            }
            if(i == 3){
                let el_svg = btn_nav[i].querySelector("object").contentDocument.querySelector("svg")
                el_svg.style.fill="black";
                el_svg.style.stroke="none";
            }

            let body_page = document.querySelector(".content__body");
            body_page.animate([
                {
                    left: body_page.style.left,
                },
                {
                    left: "-"+(1025*i+"px"),
                }
            ],{
                duration: 2000,
                iterations: 1
            });
            body_page.style.left = "-"+(1025*i+"px");
        };

        // hover[i].addEventListener("mouseover", function(){
        //     currentColor = this.style.backgroundColor; //Сохраняю текущий цвет элемента, чтобы после ухода курсора с элемента, можно было вернуть его исходный цвет.
        //     this.style.backgroundColor = "aquamarine";
        // });
        // hover[i].addEventListener("mouseout", function(){
        //     this.style.backgroundColor = currentColor;
        // });
    }

    // ============================================================================================
    let arr_plus = document.querySelectorAll(".plus__hidden-text");
    let arr_hidden = document.querySelectorAll(".hidden-text");
    for(let i = 0; i < arr_plus.length; i++){
        arr_plus[i].onclick = () =>{
            let el_photo = document.querySelector(".photo_work");
            el_photo.animate([
                {
                    backgroundImage: el_photo.style.backgroundImage
                },
                {
                    backgroundImage: "url('/img/content_page/web"+(i+1)+".png')"
                }
            ],{
                duration: 1000,
                iterations: 1
            });
            el_photo.style.backgroundImage = "url('/img/content_page/web"+(i+1)+".png')";

            let el_close = document.querySelector(".open__hidden-text");
            el_close.animate([
                {
                    maxHeight: el_close.clientHeight+"px"
                },
                {
                    maxHeight: "55px"
                }
            ],{
                duration: 1000,
                iterations: 1
            });
            el_close.classList.remove("open__hidden-text");
            let el_close_plus = el_close.querySelector(".plus_2");
            el_close_plus.animate([
                {
                    transform: "rotate(0deg)"
                },
                {
                    transform: "rotate(90deg)"
                }
            ],{
                duration: 1000,
                iterations: 1
            });
            el_close_plus.style.transform = "rotate(90deg)";

            let el_plus = arr_plus[i].querySelector(".plus_2");
            el_plus.animate([
                {
                    transform: "rotate(90deg)"
                },
                {
                    transform: "rotate(0deg)"
                }
            ],{
                duration: 1000,
                iterations: 1
            });
            el_plus.style.transform = "rotate(0deg)";

            arr_hidden[i].animate([
                {
                    maxHeight: "55px"
                },
                {
                    maxHeight: 55+arr_hidden[i].querySelector(".body__hidden-text").clientHeight+"px"
                }
            ],{
                duration: 1000,
                iterations: 1
            });
            arr_hidden[i].classList.add("open__hidden-text")
        }
    }

    // ============================================================================================
    let arr_words = [
        "Привет!",
        "Hello!",
        "嗨！",
        "안녕!",
        "Բարեւ ձեզ!",
        "Hæ!",
        "Здраво!",
        "Olá!",
        "ഹായ്!",
        "हाय!",
        "नमस्कार!",
        "Ciao!",
        "ಹಾಯ್!",
        "Сәләм!",
        "Helo!",
        "こんにちは!"
    ];
    let el_hello = document.querySelector(".body__chat-hello").querySelector("p");
    let el_cursor = document.querySelector(".cursor");
    el_cursor.animate([
        {
            opacity: 0
        },
        {
            offset: 0.5,
            opacity: 1
        },
        {
            opacity: 0
        }
    ],{
        duration: 600,
        iterations: Infinity
    });

    // let main_time = 3000;
    let main_time = 3000;
    for(let i = 0; i < arr_words.length; i++){
        let time1 = (300*arr_words[i].length)*i;
        let time2 = (300*arr_words[i].length)*(i+1);
        setTimeout(setText, main_time, ".body__chat-hello p", arr_words[i], 300);
        main_time += 4000;
        setTimeout(deleteText, main_time, ".body__chat-hello p", 300);
        main_time += 4000;
    }
    setInterval(function(){
        let main_time = 3000;
        for(let i = 0; i < arr_words.length; i++){
            let time1 = (300*arr_words[i].length)*i;
            let time2 = (300*arr_words[i].length)*(i+1);
            setTimeout(setText, main_time, ".body__chat-hello p", arr_words[i], 300);
            main_time += 4000;
            setTimeout(deleteText, main_time, ".body__chat-hello p", 300);
            main_time += 4000;
        }
    },64000);

    //================================================================================================================================
    setInterval(function() {
        var date = new Date();
        document.getElementById("time").innerHTML = (date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds());
    }, 1000);
}, 0)
});

// меняем даже когда меняеться размер экрана браузера
window.addEventListener('resize', function(event) {
    let main_el = document.querySelector(".content__main-window");
    main_el.style.top = (document.body.clientHeight - main_el.clientHeight)/2 + "px";
    main_el.style.left = (document.body.clientWidth - main_el.clientWidth)/2 + "px";
}, true);
