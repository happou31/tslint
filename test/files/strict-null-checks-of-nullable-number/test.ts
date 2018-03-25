/**
 * hogehoge
 */
class Test {
    private n?: number;
    private nullablen: number | null = null;
    private m: number;
    private s?: string;
    constructor() {
        this.f();
    }
    private f() {
        let nn = this.n;
        let ss = this.s;

        if (!this.n) {
            this.m += 10;
        }

        if (this.n) {
            this.m += this.n;
        }

        if (nn) {
            this.m += nn;
        }

        if (this.nullablen) {
            this.nullablen += 10;
        }

        if (this.s) {
            this.s += "a";
        }

        if (!this.s) {
            this.s = "a";
        }

        if (ss) {
            ss += "aa";
        }

        if (!ss) {
            ss = "aa";
        }

        return this.m;
    }
}
