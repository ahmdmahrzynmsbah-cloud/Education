#!/bin/bash
sed -i '/<title>منصة تفوق<\/title>/a \    <script>\n      if (localStorage.theme === "dark" || (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)) {\n        document.documentElement.classList.add("dark");\n      } else {\n        document.documentElement.classList.remove("dark");\n      }\n    </script>' index.html
