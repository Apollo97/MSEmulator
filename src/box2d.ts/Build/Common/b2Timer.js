/*
* Copyright (c) 2011 Erin Catto http://box2d.org
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
/// Timer for profiling. This has platform specific code and may
/// not work on every platform.
export class b2Timer {
    constructor() {
        this.m_start = Date.now();
    }
    /// Reset the timer.
    Reset() {
        this.m_start = Date.now();
        return this;
    }
    /// Get the time since construction or the last reset.
    GetMilliseconds() {
        return Date.now() - this.m_start;
    }
}
export class b2Counter {
    constructor() {
        this.m_count = 0;
        this.m_min_count = 0;
        this.m_max_count = 0;
    }
    GetCount() {
        return this.m_count;
    }
    GetMinCount() {
        return this.m_min_count;
    }
    GetMaxCount() {
        return this.m_max_count;
    }
    ResetCount() {
        const count = this.m_count;
        this.m_count = 0;
        return count;
    }
    ResetMinCount() {
        this.m_min_count = 0;
    }
    ResetMaxCount() {
        this.m_max_count = 0;
    }
    Increment() {
        this.m_count++;
        if (this.m_max_count < this.m_count) {
            this.m_max_count = this.m_count;
        }
    }
    Decrement() {
        this.m_count--;
        if (this.m_min_count > this.m_count) {
            this.m_min_count = this.m_count;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJUaW1lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL0JveDJEL0NvbW1vbi9iMlRpbWVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0VBZ0JFO0FBRUYsZ0VBQWdFO0FBQ2hFLCtCQUErQjtBQUMvQixNQUFNLE9BQU8sT0FBTztJQUFwQjtRQUNTLFlBQU8sR0FBVyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7SUFZdEMsQ0FBQztJQVZDLG9CQUFvQjtJQUNiLEtBQUs7UUFDVixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUMxQixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxzREFBc0Q7SUFDL0MsZUFBZTtRQUNwQixPQUFPLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO0lBQ25DLENBQUM7Q0FDRjtBQUVELE1BQU0sT0FBTyxTQUFTO0lBQXRCO1FBQ1MsWUFBTyxHQUFXLENBQUMsQ0FBQztRQUNwQixnQkFBVyxHQUFXLENBQUMsQ0FBQztRQUN4QixnQkFBVyxHQUFXLENBQUMsQ0FBQztJQTJDakMsQ0FBQztJQXpDUSxRQUFRO1FBQ2IsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO0lBQ3RCLENBQUM7SUFFTSxXQUFXO1FBQ2hCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztJQUMxQixDQUFDO0lBRU0sV0FBVztRQUNoQixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7SUFDMUIsQ0FBQztJQUVNLFVBQVU7UUFDZixNQUFNLEtBQUssR0FBVyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ25DLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDO1FBQ2pCLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVNLGFBQWE7UUFDbEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUM7SUFDdkIsQ0FBQztJQUVNLGFBQWE7UUFDbEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUM7SUFDdkIsQ0FBQztJQUVNLFNBQVM7UUFDZCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFFZixJQUFJLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNuQyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7U0FDakM7SUFDSCxDQUFDO0lBRU0sU0FBUztRQUNkLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUVmLElBQUksSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ25DLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztTQUNqQztJQUNILENBQUM7Q0FDRiJ9