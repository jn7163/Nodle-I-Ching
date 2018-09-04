import { BitMatrix } from "../BitMatrix";
import * as Constants from "../constants";
import { EncodedIChing } from "../EncodedIChing";
import { ImageData } from "../ImageData";
import { Point } from "../Point";

/**
 * Writer class encapsulating IChing rendering methods.
 *
 * @export
 * @class Writer
 */
export class Writer {
    /**
     * Renders the provided encoded IChing.
     *
     * @static
     * @param {EncodedIChing} code - Object representing an encoded IChing.
     * @returns {ImageData} - Image data for the rendered IChing.
     */
    public static render(code: EncodedIChing): ImageData {
        const rows = code.rows;
        const cols = code.cols;
        const imgHeight = rows * Constants.SYMBOL_DIM + (rows - 1) * Constants.GAP_DIM
            + Constants.GRID_OFFSET * 2;
        const imgWidth = cols * Constants.SYMBOL_DIM + (cols - 1) * Constants.GAP_DIM
            + Constants.GRID_OFFSET * 2;

        // Creates a BitMatrix filled with 0s.
        const matrix = new BitMatrix(imgHeight, imgWidth);

        // Draw finder patterns.
        this.drawFinderPattern(
            { x: Constants.FINDER_OFFSET, y: Constants.FINDER_OFFSET }, matrix,
        );
        this.drawFinderPattern(
            { x: imgWidth - Constants.FINDER_OFFSET, y: Constants.FINDER_OFFSET }, matrix,
        );
        this.drawFinderPattern(
            { x: Constants.FINDER_OFFSET, y: imgHeight - Constants.FINDER_OFFSET }, matrix,
        );

        // Draw alignment pattern.
        this.drawAlignmentPattern(
            { x: imgWidth - Constants.FINDER_OFFSET, y: imgHeight - Constants.FINDER_OFFSET },
            matrix,
        );

        // Draw symbols.
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                this.drawSymbol(i, j, code.data[i * cols + j], matrix);
            }
        }

        return new ImageData(matrix);
    }

    private static drawFinderPattern(centre: Point, matrix: BitMatrix): void {
        const r1 = Constants.FINDER_RADIUS * 3 / 7;
        const r2 = Constants.FINDER_RADIUS * 5 / 7;
        const r3 = Constants.FINDER_RADIUS;

        // Inner black circle.
        for (let i = 0; i <= r1; i++) {
            this.drawCircle(centre, i, 1, matrix);
        }

        // Outer black ring.
        for (let i = r2 + 1; i <= r3; i++) {
            this.drawCircle(centre, i, 1, matrix);
        }
    }

    private static drawAlignmentPattern(centre: Point, matrix: BitMatrix): void {
        const r1 = Constants.FINDER_RADIUS * 3 / 7;
        const r2 = Constants.FINDER_RADIUS * 5 / 7;

        for (let i = r1 + 1; i <= r2; i++) {
            this.drawCircle(centre, i, 1, matrix);
        }
    }

    /**
     * Draws a circle with the given parameters, using the mid-point algorithm variant with
     * integer-based arithmetic.
     *
     * @see [Wikipedia's page]{@link https://en.wikipedia.org/wiki/Midpoint_circle_algorithm}
     * for more info.
     */
    private static drawCircle(c: Point, r: number, color: number, matrix: BitMatrix): void {
        let x = r;
        let y = 0;
        let dx = 1;
        let dy = 1;
        let err = dx - 2 * r;
        while (x >= y) {
            this.setPixelSymmetricOctant(c, x, y, color, matrix);
            if (err <= 0) {
                y++;
                err += dy;
                dy += 2;
            } else {
                x--;
                dx += 2;
                err += dx - 2 * r;
            }
        }
    }

    /**
     * Takes pixel coordinates in one octant and sets it symmetrically in all 8 octants,
     * relative to the given centre.
     */
    private static setPixelSymmetricOctant(
        c: Point, x: number, y: number, color: number, matrix: BitMatrix,
    ): void {
        matrix.set(c.x + x, c.y + y, color);
        matrix.set(c.x + x, c.y - y, color);
        matrix.set(c.x - x, c.y + y, color);
        matrix.set(c.x - x, c.y - y, color);
        matrix.set(c.x + y, c.y + x, color);
        matrix.set(c.x + y, c.y - x, color);
        matrix.set(c.x - y, c.y + x, color);
        matrix.set(c.x - y, c.y - x, color);
    }

    private static drawSymbol(row: number, col: number, mask: number, matrix: BitMatrix): void {
        const startX = col * (Constants.SYMBOL_DIM + Constants.GAP_DIM) + Constants.GRID_OFFSET;
        const startY = row * (Constants.SYMBOL_DIM + Constants.GAP_DIM) + Constants.GRID_OFFSET;

        for (let bit = 0; bit < Constants.BITS_PER_SYMBOL; bit++) {
            // Draw a filled rectangle representing the bit.
            this.fillRect(
                startX, startY + Constants.UNIT_DIM * bit * 2,
                Constants.SYMBOL_DIM, Constants.UNIT_DIM, 1, matrix,
            );

            // If bit is zero, clear middle area.
            if ((mask & (1 << bit)) === 0) {
                this.fillRect(
                    startX + Constants.UNIT_DIM * 4.5, startY + Constants.UNIT_DIM * bit * 2,
                    Constants.UNIT_DIM * 2, Constants.UNIT_DIM, 0, matrix,
                );
            }
        }
    }

    // Draws a filled rectangle with given parameters.
    private static fillRect(
        x: number, y: number, width: number, height: number, color: number, matrix: BitMatrix,
    ): void {
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                matrix.set(x + j, y + i, color);
            }
        }
    }
}
