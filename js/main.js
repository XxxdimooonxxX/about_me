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
}, 0)
});

// меняем даже когда меняеться размер экрана браузера
window.addEventListener('resize', function(event) {
    let main_el = document.querySelector(".content__main-window");
    main_el.style.top = (document.body.clientHeight - main_el.clientHeight)/2 + "px";
    main_el.style.left = (document.body.clientWidth - main_el.clientWidth)/2 + "px";
}, true);
