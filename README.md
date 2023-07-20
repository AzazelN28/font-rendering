# Surrender

Comparison of Chrome Font rendering and WebGL 2 MSDF Font Rendering

![Comparison](/public/comp.png)

## MSDF Font Rendering

Multichannel Signed Distance Fields Font Rendering using WebGL2.

![Corben](/public/msdf/Corben.png)

## Generating MSDF Font Atlas

```sh
msdf-bmfont -reuse -m 512,512 -f json -o public/msdf/Corben.png -s 32 -r 8 -p 1 -t msdf public/fonts/Corben-Regular.ttf
```

Made with :heart: by [AzazelN28](https://github.com/AzazelN28)
