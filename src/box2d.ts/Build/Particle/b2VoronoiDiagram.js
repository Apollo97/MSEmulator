/*
 * Copyright (c) 2013 Google, Inc.
 *
 * This software is provided 'as-is', without any express or implied
 * warranty.  In no event will the authors be held liable for any damages
 * arising from the use of this software.
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 * 1. The origin of this software must not be misrepresented; you must not
 * claim that you wrote the original software. If you use this software
 * in a product, an acknowledgment in the product documentation would be
 * appreciated but is not required.
 * 2. Altered source versions must be plainly marked as such, and must not be
 * misrepresented as being the original software.
 * 3. This notice may not be removed or altered from any source distribution.
 */
// #if B2_ENABLE_PARTICLE
// DEBUG: import { b2Assert } from "../Common/b2Settings";
import { b2_maxFloat, b2MakeArray } from "../Common/b2Settings";
import { b2Vec2 } from "../Common/b2Math";
import { b2StackQueue } from "./b2StackQueue";
/**
 * A field representing the nearest generator from each point.
 */
export class b2VoronoiDiagram {
    constructor(generatorCapacity) {
        this.m_generatorCapacity = 0;
        this.m_generatorCount = 0;
        this.m_countX = 0;
        this.m_countY = 0;
        this.m_diagram = [];
        this.m_generatorBuffer = b2MakeArray(generatorCapacity, (index) => new b2VoronoiDiagram.Generator());
        this.m_generatorCapacity = generatorCapacity;
    }
    /**
     * Add a generator.
     *
     * @param center the position of the generator.
     * @param tag a tag used to identify the generator in callback functions.
     * @param necessary whether to callback for nodes associated with the generator.
     */
    AddGenerator(center, tag, necessary) {
        // DEBUG: b2Assert(this.m_generatorCount < this.m_generatorCapacity);
        const g = this.m_generatorBuffer[this.m_generatorCount++];
        g.center.Copy(center);
        g.tag = tag;
        g.necessary = necessary;
    }
    /**
     * Generate the Voronoi diagram. It is rasterized with a given
     * interval in the same range as the necessary generators exist.
     *
     * @param radius the interval of the diagram.
     * @param margin margin for which the range of the diagram is extended.
     */
    Generate(radius, margin) {
        const inverseRadius = 1 / radius;
        const lower = new b2Vec2(+b2_maxFloat, +b2_maxFloat);
        const upper = new b2Vec2(-b2_maxFloat, -b2_maxFloat);
        let necessary_count = 0;
        for (let k = 0; k < this.m_generatorCount; k++) {
            const g = this.m_generatorBuffer[k];
            if (g.necessary) {
                b2Vec2.MinV(lower, g.center, lower);
                b2Vec2.MaxV(upper, g.center, upper);
                ++necessary_count;
            }
        }
        if (necessary_count === 0) {
            ///debugger;
            this.m_countX = 0;
            this.m_countY = 0;
            return;
        }
        lower.x -= margin;
        lower.y -= margin;
        upper.x += margin;
        upper.y += margin;
        this.m_countX = 1 + Math.floor(inverseRadius * (upper.x - lower.x));
        this.m_countY = 1 + Math.floor(inverseRadius * (upper.y - lower.y));
        ///  m_diagram = (Generator**) m_allocator->Allocate(sizeof(Generator*) * m_countX * m_countY);
        ///  for (int32 i = 0; i < m_countX * m_countY; i++)
        ///  {
        ///    m_diagram[i] = NULL;
        ///  }
        this.m_diagram = []; // b2MakeArray(this.m_countX * this.m_countY, (index) => null);
        // (4 * m_countX * m_countY) is the queue capacity that is experimentally
        // known to be necessary and sufficient for general particle distributions.
        const queue = new b2StackQueue(4 * this.m_countX * this.m_countY);
        for (let k = 0; k < this.m_generatorCount; k++) {
            const g = this.m_generatorBuffer[k];
            ///  g.center = inverseRadius * (g.center - lower);
            g.center.SelfSub(lower).SelfMul(inverseRadius);
            const x = Math.floor(g.center.x);
            const y = Math.floor(g.center.y);
            if (x >= 0 && y >= 0 && x < this.m_countX && y < this.m_countY) {
                queue.Push(new b2VoronoiDiagram.Task(x, y, x + y * this.m_countX, g));
            }
        }
        while (!queue.Empty()) {
            const task = queue.Front();
            const x = task.m_x;
            const y = task.m_y;
            const i = task.m_i;
            const g = task.m_generator;
            queue.Pop();
            if (!this.m_diagram[i]) {
                this.m_diagram[i] = g;
                if (x > 0) {
                    queue.Push(new b2VoronoiDiagram.Task(x - 1, y, i - 1, g));
                }
                if (y > 0) {
                    queue.Push(new b2VoronoiDiagram.Task(x, y - 1, i - this.m_countX, g));
                }
                if (x < this.m_countX - 1) {
                    queue.Push(new b2VoronoiDiagram.Task(x + 1, y, i + 1, g));
                }
                if (y < this.m_countY - 1) {
                    queue.Push(new b2VoronoiDiagram.Task(x, y + 1, i + this.m_countX, g));
                }
            }
        }
        for (let y = 0; y < this.m_countY; y++) {
            for (let x = 0; x < this.m_countX - 1; x++) {
                const i = x + y * this.m_countX;
                const a = this.m_diagram[i];
                const b = this.m_diagram[i + 1];
                if (a !== b) {
                    queue.Push(new b2VoronoiDiagram.Task(x, y, i, b));
                    queue.Push(new b2VoronoiDiagram.Task(x + 1, y, i + 1, a));
                }
            }
        }
        for (let y = 0; y < this.m_countY - 1; y++) {
            for (let x = 0; x < this.m_countX; x++) {
                const i = x + y * this.m_countX;
                const a = this.m_diagram[i];
                const b = this.m_diagram[i + this.m_countX];
                if (a !== b) {
                    queue.Push(new b2VoronoiDiagram.Task(x, y, i, b));
                    queue.Push(new b2VoronoiDiagram.Task(x, y + 1, i + this.m_countX, a));
                }
            }
        }
        while (!queue.Empty()) {
            const task = queue.Front();
            const x = task.m_x;
            const y = task.m_y;
            const i = task.m_i;
            const k = task.m_generator;
            queue.Pop();
            const a = this.m_diagram[i];
            const b = k;
            if (a !== b) {
                const ax = a.center.x - x;
                const ay = a.center.y - y;
                const bx = b.center.x - x;
                const by = b.center.y - y;
                const a2 = ax * ax + ay * ay;
                const b2 = bx * bx + by * by;
                if (a2 > b2) {
                    this.m_diagram[i] = b;
                    if (x > 0) {
                        queue.Push(new b2VoronoiDiagram.Task(x - 1, y, i - 1, b));
                    }
                    if (y > 0) {
                        queue.Push(new b2VoronoiDiagram.Task(x, y - 1, i - this.m_countX, b));
                    }
                    if (x < this.m_countX - 1) {
                        queue.Push(new b2VoronoiDiagram.Task(x + 1, y, i + 1, b));
                    }
                    if (y < this.m_countY - 1) {
                        queue.Push(new b2VoronoiDiagram.Task(x, y + 1, i + this.m_countX, b));
                    }
                }
            }
        }
    }
    /**
     * Enumerate all nodes that contain at least one necessary
     * generator.
     */
    GetNodes(callback) {
        for (let y = 0; y < this.m_countY - 1; y++) {
            for (let x = 0; x < this.m_countX - 1; x++) {
                const i = x + y * this.m_countX;
                const a = this.m_diagram[i];
                const b = this.m_diagram[i + 1];
                const c = this.m_diagram[i + this.m_countX];
                const d = this.m_diagram[i + 1 + this.m_countX];
                if (b !== c) {
                    if (a !== b && a !== c &&
                        (a.necessary || b.necessary || c.necessary)) {
                        callback(a.tag, b.tag, c.tag);
                    }
                    if (d !== b && d !== c &&
                        (a.necessary || b.necessary || c.necessary)) {
                        callback(b.tag, d.tag, c.tag);
                    }
                }
            }
        }
    }
}
(function (b2VoronoiDiagram) {
    class Generator {
        constructor() {
            this.center = new b2Vec2();
            this.tag = 0;
            this.necessary = false;
        }
    }
    b2VoronoiDiagram.Generator = Generator;
    class Task {
        constructor(x, y, i, g) {
            this.m_x = x;
            this.m_y = y;
            this.m_i = i;
            this.m_generator = g;
        }
    }
    b2VoronoiDiagram.Task = Task;
})(b2VoronoiDiagram || (b2VoronoiDiagram = {})); // namespace b2VoronoiDiagram
// #endif
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJWb3Jvbm9pRGlhZ3JhbS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL0JveDJEL1BhcnRpY2xlL2IyVm9yb25vaURpYWdyYW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7R0FnQkc7QUFFSCx5QkFBeUI7QUFFekIsMERBQTBEO0FBQzFELE9BQU8sRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDaEUsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBQzFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUU5Qzs7R0FFRztBQUNILE1BQU0sT0FBTyxnQkFBZ0I7SUFRM0IsWUFBWSxpQkFBeUI7UUFOOUIsd0JBQW1CLEdBQUcsQ0FBQyxDQUFDO1FBQ3hCLHFCQUFnQixHQUFHLENBQUMsQ0FBQztRQUNyQixhQUFRLEdBQUcsQ0FBQyxDQUFDO1FBQ2IsYUFBUSxHQUFHLENBQUMsQ0FBQztRQUNiLGNBQVMsR0FBaUMsRUFBRSxDQUFDO1FBR2xELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxXQUFXLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLElBQUksZ0JBQWdCLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztRQUNyRyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsaUJBQWlCLENBQUM7SUFDL0MsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNJLFlBQVksQ0FBQyxNQUFjLEVBQUUsR0FBVyxFQUFFLFNBQWtCO1FBQ2pFLHFFQUFxRTtRQUNyRSxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQztRQUMxRCxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN0QixDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNaLENBQUMsQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO0lBQzFCLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSSxRQUFRLENBQUMsTUFBYyxFQUFFLE1BQWM7UUFDNUMsTUFBTSxhQUFhLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQztRQUNqQyxNQUFNLEtBQUssR0FBRyxJQUFJLE1BQU0sQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3JELE1BQU0sS0FBSyxHQUFHLElBQUksTUFBTSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDckQsSUFBSSxlQUFlLEdBQUcsQ0FBQyxDQUFDO1FBQ3hCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDOUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxDQUFDLFNBQVMsRUFBRTtnQkFDZixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNwQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNwQyxFQUFFLGVBQWUsQ0FBQzthQUNuQjtTQUNGO1FBQ0QsSUFBSSxlQUFlLEtBQUssQ0FBQyxFQUFFO1lBQ3pCLFlBQVk7WUFDWixJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQztZQUNsQixJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQztZQUNsQixPQUFPO1NBQ1I7UUFDRCxLQUFLLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQztRQUNsQixLQUFLLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQztRQUNsQixLQUFLLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQztRQUNsQixLQUFLLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQztRQUNsQixJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEUsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BFLCtGQUErRjtRQUMvRixvREFBb0Q7UUFDcEQsTUFBTTtRQUNOLDJCQUEyQjtRQUMzQixNQUFNO1FBQ04sSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUMsQ0FBQywrREFBK0Q7UUFFcEYseUVBQXlFO1FBQ3pFLDJFQUEyRTtRQUMzRSxNQUFNLEtBQUssR0FBRyxJQUFJLFlBQVksQ0FBd0IsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3pGLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDOUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BDLG1EQUFtRDtZQUNuRCxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDL0MsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDOUQsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3ZFO1NBQ0Y7UUFDRCxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFO1lBQ3JCLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUMzQixNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQ25CLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDbkIsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUNuQixNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO1lBQzNCLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUNaLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUN0QixJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDdEIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFO29CQUNULEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUMzRDtnQkFDRCxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUU7b0JBQ1QsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUN2RTtnQkFDRCxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsRUFBRTtvQkFDekIsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQzNEO2dCQUNELElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxFQUFFO29CQUN6QixLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ3ZFO2FBQ0Y7U0FDRjtRQUNELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3RDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDMUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO2dCQUNoQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM1QixNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDaEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO29CQUNYLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDbEQsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQzNEO2FBQ0Y7U0FDRjtRQUNELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUMxQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDdEMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO2dCQUNoQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM1QixNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQzVDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtvQkFDWCxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2xELEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDdkU7YUFDRjtTQUNGO1FBQ0QsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRTtZQUNyQixNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDM0IsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUNuQixNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQ25CLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDbkIsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztZQUMzQixLQUFLLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDWixNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVCLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNaLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDWCxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzFCLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDMUIsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMxQixNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzFCLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztnQkFDN0IsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDO2dCQUM3QixJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUU7b0JBQ1gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ3RCLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRTt3QkFDVCxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztxQkFDM0Q7b0JBQ0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFO3dCQUNULEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztxQkFDdkU7b0JBQ0QsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLEVBQUU7d0JBQ3pCLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO3FCQUMzRDtvQkFDRCxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsRUFBRTt3QkFDekIsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO3FCQUN2RTtpQkFDRjthQUNGO1NBQ0Y7SUFDSCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0ksUUFBUSxDQUFDLFFBQXVDO1FBQ3JELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUMxQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQzFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztnQkFDaEMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDNUIsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDNUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDaEQsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO29CQUNYLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQzt3QkFDcEIsQ0FBQyxDQUFDLENBQUMsU0FBUyxJQUFJLENBQUMsQ0FBQyxTQUFTLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUFFO3dCQUM3QyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztxQkFDL0I7b0JBQ0QsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO3dCQUNwQixDQUFDLENBQUMsQ0FBQyxTQUFTLElBQUksQ0FBQyxDQUFDLFNBQVMsSUFBSSxDQUFDLENBQUMsU0FBUyxDQUFDLEVBQUU7d0JBQzdDLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO3FCQUMvQjtpQkFDRjthQUNGO1NBQ0Y7SUFDSCxDQUFDO0NBQ0Y7QUFFRCxXQUFpQixnQkFBZ0I7SUFTakMsTUFBYSxTQUFTO1FBQXRCO1lBQ1MsV0FBTSxHQUFXLElBQUksTUFBTSxFQUFFLENBQUM7WUFDOUIsUUFBRyxHQUFXLENBQUMsQ0FBQztZQUNoQixjQUFTLEdBQVksS0FBSyxDQUFDO1FBQ3BDLENBQUM7S0FBQTtJQUpZLDBCQUFTLFlBSXJCLENBQUE7SUFFRCxNQUFhLElBQUk7UUFLZixZQUFZLENBQVMsRUFBRSxDQUFTLEVBQUUsQ0FBUyxFQUFFLENBQTZCO1lBQ3hFLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1lBQ2IsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFDYixJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztZQUNiLElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZCLENBQUM7S0FDRjtJQVhZLHFCQUFJLE9BV2hCLENBQUE7QUFFRCxDQUFDLEVBNUJnQixnQkFBZ0IsS0FBaEIsZ0JBQWdCLFFBNEJoQyxDQUFDLDZCQUE2QjtBQUUvQixTQUFTIn0=