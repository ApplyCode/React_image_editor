import {Image} from 'fabric/fabric-impl';
import {loadFabricImage} from './load-fabric-image';
import {ObjectName} from '../../objects/object-name';
import {state, tools} from '../../state/utils';
import { uploadMediaImage } from './uploader';

export async function addImage(
  url: string,
  fitToScreen = true
): Promise<Image | undefined> {
  const uploadedImageUrl = await uploadMediaImage(url);
  const img = await loadFabricImage(uploadedImageUrl);
  if (!img) return;
  return new Promise(resolve => {
    img.name = ObjectName.Add_Image;
    img.opacity = 0;

    // use either main image or canvas dimensions as outer boundaries for scaling new image
    const maxWidth = state().original.width;
    const maxHeight = state().original.height;

    // if image is wider or higher than the current canvas, we'll scale it down
    if (fitToScreen && (img.width! >= maxWidth || img.height! >= maxHeight)) {
      // calc new image dimensions (main image height - 10% and width - 10%)
      const newWidth = maxWidth - 0.1 * maxWidth;
      const newHeight = maxHeight - 0.1 * maxHeight;
      const scale =
        1 /
        Math.min(
          newHeight / img.getScaledHeight(),
          newWidth / img.getScaledWidth()
        );

      // scale newly uploaded image to the above dimensions
      img.scaleX! *= 1 / scale;
      img.scaleY! *= 1 / scale;
    }

    // center and render newly uploaded image on the canvas
    state().fabric.add(img);
    img.viewportCenter();
    img.setCoords();
    state().fabric.requestRenderAll();
    tools().zoom.fitToScreen();
    tools().canvas.render();
    state().fabric.setActiveObject(img);

    img.animate('opacity', '1', {
      duration: 425,
      onChange: () => {
        state().fabric.requestRenderAll();
      },
      onComplete: () => {
        resolve(img);
      },
    });
  });
}
