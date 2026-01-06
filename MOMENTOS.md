let's work on /momentos

it has the same basic structure as personaliza and birth poster, those will be your main point of reference and you will use figma for the new or different elemetns that may appear in the design, however, respect the style, colors and structure of our other 2 tools

- new bucket name in s3 is momentos-malek

Let's look at the 4 sidebar items that /momentos will have and what each will contain



- Diseño
  - tabs diseño and imágenes, you can see the design here
  @https://www.figma.com/design/2MjMqlcZxbD7i5YBxsRwD8/STUDIO-MALEK-DEV--Copy-?node-id=26541-12297&m=dev
    - tab diseño
      - title: formato
        - the user will select between square, horizontal and vertical (spanish) use the styles of .panel-texto__styles
      - title: 'Número de imágenes' 
        - for the number of images, use the style in
      @https://www.figma.com/design/2MjMqlcZxbD7i5YBxsRwD8/STUDIO-MALEK-DEV--Copy-?node-id=26541-12310&m=dev
        - if square
          - can select 4, 25 or 64 
        - if vertical
          - can select 12 / 35 / 88
        - if horizontal 
          - can select 12 / 35 / 88
        - depending on the number images selected, the canvas will show a grid where each item is a place where an image can be placed, all the images inside shall be square
        - below numero de imágenes is a separator in the style of .panel-archivo__separator
        - below the separator is a button, here it is in figma
      @https://www.figma.com/design/2MjMqlcZxbD7i5YBxsRwD8/STUDIO-MALEK-DEV--Copy-?node-id=26541-12322&m=dev, use the style of panel-archivo__change-btn
        - below is a separator in the style of .panel-archivo__separator
        - below is the margin section, which is a copy of <!-- Margin selector --> and <!-- Margin color (only if margin is enabled) --> from personaliza
    - tab imágenes
      - the upload like, like the panel-archivo__upload-section we have already, but this will always be present as the user can upload up to 100 images, each images has a max size of 20mb
      - below a separator like .panel-archivo__separator
      - below are the images the user has uploaded in this style
  @https://www.figma.com/design/2MjMqlcZxbD7i5YBxsRwD8/STUDIO-MALEK-DEV--Copy-?node-id=26541-12721&m=dev, except that we will only have 2 per row, not 4, the user will be able to drag and drop to empty image placeholders in the canvas
      - between imágene disponibles and the images, please add a subtle button like   panel-archivo__change-btn that autofills the empty image in the canvas in order

- Archivos
  - This is just a shortcut to the imágenes tab in the diseño sidebar item, basically

- Medidas, depending on the orientation, basically the same as the sidebar item medidas in .panel-medidas in personaliza, but the warning says that you may change orientation in diseño instead

- Marco
 - same as panel-marco in personaliza 

- For the product and variants so we can check prices, the product ID is 9281694335211

- use the same structure as personaliza and birth poster for mobile


- Now let's talk about the canvas, of course the canvas in terms of repsonsiveness will behave the same as in personaliza and birth poster
 - the canvas will have a set of square (ratio 1) images that initially are empty, inside each we will have the icon same as <!-- Image/Archivo icon --> with no fill of course
  - if the user selects and empty image, the imagenes tab in diseño opens and you can select and image and it will populate
  - you can also drag and drop from the uploaded images to the empty images in the canvas 
  - if the item has an image and the user clicks on it, a menu below the item will appear where the user can 'rotate', 'zoom in', 'zoom out' or delete and also select from predefined filters (grayscale, sephia, not sure what others, you can decide)
  - we will have an undo and redo stack (if possible please!)

- Now let's talk about how the images will be saved, my idea is to save 3 versions of each image uploade by the user, a low res image for the display in the 'imagenes' tab in diseño item (200px wide), one medium res for the canvas (2000px if it has 2000px or max) and one high res for when we generate the canvas, similar to personaliza, does that make sense? I think it doesn, the use html-to-image probably or canvas api if not too difficult to generate the _image in shopify and add to cart as we do in baby poster and personaliza



- here is the general product figma
@https://www.figma.com/design/2MjMqlcZxbD7i5YBxsRwD8/STUDIO-MALEK-DEV--Copy-?node-id=26541-10726&m=dev  and 
@https://www.figma.com/design/2MjMqlcZxbD7i5YBxsRwD8/STUDIO-MALEK-DEV--Copy-?node-id=26541-12439&m=dev but again, your best reference is what we have already done and my instructions above