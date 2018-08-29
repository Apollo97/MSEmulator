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
import { b2MakeArray } from "../Common/b2Settings";
export class b2StackQueue {
    constructor(capacity) {
        this.m_front = 0;
        this.m_back = 0;
        this.m_capacity = 0;
        this.m_buffer = b2MakeArray(capacity, (index) => null);
        this.m_capacity = capacity;
    }
    Push(item) {
        if (this.m_back >= this.m_capacity) {
            for (let i = this.m_front; i < this.m_back; i++) {
                this.m_buffer[i - this.m_front] = this.m_buffer[i];
            }
            this.m_back -= this.m_front;
            this.m_front = 0;
            if (this.m_back >= this.m_capacity) {
                if (this.m_capacity > 0) {
                    this.m_buffer.concat(b2MakeArray(this.m_capacity, (index) => null));
                    this.m_capacity *= 2;
                }
                else {
                    this.m_buffer.concat(b2MakeArray(1, (index) => null));
                    this.m_capacity = 1;
                }
                ///m_buffer = (T*) m_allocator->Reallocate(m_buffer, sizeof(T) * m_capacity);
            }
        }
        this.m_buffer[this.m_back] = item;
        this.m_back++;
    }
    Pop() {
        // DEBUG: b2Assert(this.m_front < this.m_back);
        this.m_buffer[this.m_front] = null;
        this.m_front++;
    }
    Empty() {
        // DEBUG: b2Assert(this.m_front <= this.m_back);
        return this.m_front === this.m_back;
    }
    Front() {
        const item = this.m_buffer[this.m_front];
        if (!item) {
            throw new Error();
        }
        return item;
    }
}
// #endif
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJTdGFja1F1ZXVlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vQm94MkQvUGFydGljbGUvYjJTdGFja1F1ZXVlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0dBZ0JHO0FBRUgseUJBQXlCO0FBRXpCLDBEQUEwRDtBQUMxRCxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFFbkQsTUFBTSxPQUFPLFlBQVk7SUFLdkIsWUFBWSxRQUFnQjtRQUhyQixZQUFPLEdBQVcsQ0FBQyxDQUFDO1FBQ3BCLFdBQU0sR0FBVyxDQUFDLENBQUM7UUFDbkIsZUFBVSxHQUFXLENBQUMsQ0FBQztRQUU1QixJQUFJLENBQUMsUUFBUSxHQUFHLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZELElBQUksQ0FBQyxVQUFVLEdBQUcsUUFBUSxDQUFDO0lBQzdCLENBQUM7SUFDTSxJQUFJLENBQUMsSUFBTztRQUNqQixJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNsQyxLQUFLLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQy9DLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3BEO1lBQ0QsSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQzVCLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDO1lBQ2pCLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO2dCQUNsQyxJQUFJLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxFQUFFO29CQUN2QixJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztvQkFDcEUsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLENBQUM7aUJBQ3RCO3FCQUFNO29CQUNMLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBQ3RELElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDO2lCQUNyQjtnQkFDRCw2RUFBNkU7YUFDOUU7U0FDRjtRQUNELElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQztRQUNsQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDaEIsQ0FBQztJQUNNLEdBQUc7UUFDUiwrQ0FBK0M7UUFDL0MsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQ25DLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUNqQixDQUFDO0lBQ00sS0FBSztRQUNWLGdEQUFnRDtRQUNoRCxPQUFPLElBQUksQ0FBQyxPQUFPLEtBQUssSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUN0QyxDQUFDO0lBQ00sS0FBSztRQUNWLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3pDLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFBRSxNQUFNLElBQUksS0FBSyxFQUFFLENBQUM7U0FBRTtRQUNqQyxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7Q0FDRjtBQUVELFNBQVMifQ==