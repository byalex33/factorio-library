import { ActionRegistry } from "@/src/vendor/fbe-editor/actions";
import G from "@/src/vendor/fbe-editor/common/globals";
import { Book, Blueprint, Editor, getBlueprintOrBookFromSource } from "@/src/vendor/fbe-editor";

export async function renderBlueprintPreview(canvas: HTMLCanvasElement, blueprintString: string) {
  if (typeof window === "undefined") {
    throw new Error("Blueprint previews can only render in the browser.");
  }

  const source = blueprintString.trim();
  if (!source) {
    throw new Error("Missing blueprint string.");
  }

  const editor = new Editor();
  await editor.init(canvas);

  // The upstream package is an editor. For this app we deliberately leave its
  // action registry empty and also disable pointer events in the React wrapper.
  G.actions = new ActionRegistry({});

  const blueprintOrBook = await getBlueprintOrBookFromSource(source);
  const blueprint = blueprintOrBook instanceof Book ? blueprintOrBook.selectBlueprint() : blueprintOrBook;

  if (!(blueprint instanceof Blueprint)) {
    throw new Error("No renderable blueprint found.");
  }

  await editor.loadBlueprint(blueprint);
  editor.gridColor = 0x252a31;
}
