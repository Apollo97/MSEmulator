/*
* Copyright (c) 2010 Erin Catto http://www.box2d.org
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
// DEBUG: import { b2Assert } from "./b2Settings";
import { b2MakeArray } from "./b2Settings";
/// This is a growable LIFO stack with an initial capacity of N.
/// If the stack size exceeds the initial capacity, the heap is used
/// to increase the size of the stack.
export class b2GrowableStack {
    constructor(N) {
        this.m_stack = [];
        this.m_count = 0;
        this.m_stack = b2MakeArray(N, (index) => null);
        this.m_count = 0;
    }
    Reset() {
        this.m_count = 0;
        return this;
    }
    Push(element) {
        this.m_stack[this.m_count] = element;
        this.m_count++;
    }
    Pop() {
        // DEBUG: b2Assert(this.m_count > 0);
        this.m_count--;
        const element = this.m_stack[this.m_count];
        this.m_stack[this.m_count] = null;
        if (element === null) {
            throw new Error();
        }
        return element;
    }
    GetCount() {
        return this.m_count;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJHcm93YWJsZVN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vQm94MkQvQ29tbW9uL2IyR3Jvd2FibGVTdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7OztFQWdCRTtBQUVGLGtEQUFrRDtBQUNsRCxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBRTNDLGdFQUFnRTtBQUNoRSxvRUFBb0U7QUFDcEUsc0NBQXNDO0FBRXRDLE1BQU0sT0FBTyxlQUFlO0lBSTFCLFlBQVksQ0FBUztRQUhkLFlBQU8sR0FBb0IsRUFBRSxDQUFDO1FBQzlCLFlBQU8sR0FBVyxDQUFDLENBQUM7UUFHekIsSUFBSSxDQUFDLE9BQU8sR0FBRyxXQUFXLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMvQyxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQztJQUNuQixDQUFDO0lBRU0sS0FBSztRQUNWLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDO1FBQ2pCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVNLElBQUksQ0FBQyxPQUFVO1FBQ3BCLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLE9BQU8sQ0FBQztRQUNyQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDakIsQ0FBQztJQUVNLEdBQUc7UUFDUixxQ0FBcUM7UUFDckMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2YsTUFBTSxPQUFPLEdBQWEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDckQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQ2xDLElBQUksT0FBTyxLQUFLLElBQUksRUFBRTtZQUFFLE1BQU0sSUFBSSxLQUFLLEVBQUUsQ0FBQztTQUFFO1FBQzVDLE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFFTSxRQUFRO1FBQ2IsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO0lBQ3RCLENBQUM7Q0FDRiJ9