FROM nginx:stable-alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY index.html robots.txt /usr/share/nginx/html/
COPY css/main.css /usr/share/nginx/html/css/main.css
COPY js/main.js js/chamber.js /usr/share/nginx/html/js/
COPY img/optimized/ /usr/share/nginx/html/img/optimized/
COPY img/scene-poster.webp /usr/share/nginx/html/img/
COPY img/scene-textures/ /usr/share/nginx/html/img/scene-textures/
COPY img/social/ /usr/share/nginx/html/img/social/
COPY img/velvet.svg img/favicon.svg /usr/share/nginx/html/img/
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
