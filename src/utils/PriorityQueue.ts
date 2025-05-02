// Returns true if a should come before b
type Comparator<T> = (a: T, b: T) => boolean;

class PriorityQueue<T> {
    private heap: T[];
    private comparator: Comparator<T>;
    
    constructor(comparator: Comparator<T>) {
        this.heap = [];
        this.comparator = comparator;
    }

    public peek(): T | null {
        return this.isEmpty() ? null : this.heap[0];
    }

    public size(): number {
        return this.heap.length;
    }

    public isEmpty() {
        return this.heap.length === 0;
    }

    public enqueue(item: T) {
        this.heap.push(item);
        this.bubbleUp(this.heap.length - 1);
    }

    public dequeue(): T | null {
        if (this.isEmpty()) {
            return null;
        }
        if (this.heap.length === 1) {
            return this.heap.pop()!;
        }
        const root = this.heap[0];
        this.heap[0] = this.heap.pop()!;
        this.bubbleDown(0);
        return root;
    }

    private bubbleUp(index: number) {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (this.comparator(this.heap[index], this.heap[parentIndex])) {
                this.swap(index, parentIndex);
                index = parentIndex;
            } 
            else {
                break;
            }
        }
    }

    private bubbleDown(index: number) {
        const left = 2 * index + 1;
        const right = 2 * index + 2;
        let highest = index;
        if (left < this.heap.length && this.comparator(this.heap[left], this.heap[highest])) {
            highest = left;
        }
        if (right < this.heap.length && this.comparator(this.heap[right], this.heap[highest])) {
            highest = right;
        }
        if (highest !== index) {
            this.swap(index, highest);
            this.bubbleDown(highest);
        }
    }

    private swap(i: number, j: number) {
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    }
}

export { PriorityQueue };
