export class TimeBlock {
    constructor(name, seconds) {
        this.name = name;
        this.duration = seconds; // duration in seconds
        this.remaining = seconds;
    }
}