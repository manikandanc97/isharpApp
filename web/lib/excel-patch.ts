import ExcelJS from "exceljs";
import JSZip from "jszip";

let patched = false;

export async function normalizeExcelXmlBuffer(inputBuffer: Buffer): Promise<Buffer> {
  try {
    const zip = await JSZip.loadAsync(inputBuffer);
    let modified = false;

    for (const [filename, file] of Object.entries(zip.files)) {
      if (file.dir) continue;
      if (filename.endsWith(".xml") || filename.endsWith(".rels")) {
        const content = await file.async("string");
        let normalized = content;
        // Check if there are namespace-prefixed tags for spreadsheetml like <x:tag
        if (content.includes("<x:") || content.includes("</x:")) {
          normalized = normalized
            .replace(/<x:([a-zA-Z0-9_]+)/g, (_m, tag) => `<${tag}`)
            .replace(/<\/x:([a-zA-Z0-9_]+)>/g, (_m, tag) => `</${tag}>`)
            .replace(/xmlns:x=/g, "xmlns=");
        }

        // Office stores SVG pictures with a tiny PNG compatibility fallback.
        // ExcelJS only follows the fallback relationship, which makes real
        // SVG diagrams look like blank 1x1 images. Point it at the original
        // SVG relationship so the import pipeline can rasterize the diagram.
        if (filename.startsWith("xl/drawings/") && filename.endsWith(".xml")) {
          normalized = normalized.replace(
            /(<a:blip\b[^>]*\br:embed=")[^"]+("[^>]*>(?:(?!<\/a:blip>)[\s\S])*?<asvg:svgBlip\b[^>]*\br:embed=")([^"]+)(")/g,
            (_match, prefix, middle, svgRelationship, suffix) =>
              `${prefix}${svgRelationship}${middle}${svgRelationship}${suffix}`,
          );
        }

        if (normalized !== content) {
          zip.file(filename, normalized);
          modified = true;
        }
      }
    }

    if (!modified) return inputBuffer;
    return await zip.generateAsync({ type: "nodebuffer" });
  } catch (err) {
    console.warn("Could not normalize Excel XML namespaces:", err);
    return inputBuffer;
  }
}

export function ensureExcelJsPatched() {
  if (patched) return;
  patched = true;

  try {
    const dummy = new ExcelJS.Workbook();
    const proto = Object.getPrototypeOf(dummy.xlsx);
    if (proto) {
      if (typeof proto.reconcile === "function") {
        const originalReconcile = proto.reconcile;
        proto.reconcile = function (model: any, options: any) {
          if (model) {
            if (!model.drawings) {
              model.drawings = {};
            }
            if (model.drawingRels) {
              for (const name of Object.keys(model.drawingRels)) {
                if (!model.drawings[name]) {
                  model.drawings[name] = { anchors: [] };
                } else if (!model.drawings[name].anchors) {
                  model.drawings[name].anchors = [];
                }
              }
            }
            for (const name of Object.keys(model.drawings)) {
              if (!model.drawings[name]) {
                model.drawings[name] = { anchors: [] };
              } else if (!model.drawings[name].anchors) {
                model.drawings[name].anchors = [];
              }
            }
          }
          return originalReconcile.call(this, model, options);
        };
      }

      if (typeof proto.load === "function") {
        const originalLoad = proto.load;
        proto.load = async function (data: any, options: any) {
          if (Buffer.isBuffer(data)) {
            const normalized = await normalizeExcelXmlBuffer(data);
            return originalLoad.call(this, normalized, options);
          }
          return originalLoad.call(this, data, options);
        };
      }
    }
  } catch (err) {
    console.warn("Failed to apply ExcelJS patch:", err);
  }
}

// Auto-patch immediately on import
ensureExcelJsPatched();
