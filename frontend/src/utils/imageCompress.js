import * as ImageManipulator from "expo-image-manipulator";

const MAX_EDGE = 1080;

export const compressSnapImage = async (uri) => {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_EDGE } }],
    { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG }
  );

  return result.uri;
};
