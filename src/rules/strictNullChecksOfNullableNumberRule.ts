/**
 * @license
 * Copyright 2017 Palantir Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as utils from "tsutils";
import * as ts from "typescript";

import * as Lint from "../index";

export class Rule extends Lint.Rules.TypedRule {
    public static ruleName = "strict-null-checks-of-nullable-number";

    public static FAILURE_DESCRIPTION = "Truthy or falsy style comparison with number of null is unsafe. (`if (0)` that false.)";

    /* tslint:disable:object-literal-sort-keys */
    public static metadata: Lint.IRuleMetadata = {
        ruleName: Rule.ruleName,
        description: "Warns on comparison to a nullable number literal, as in `if (n)` or `if (!n)`",
        optionsDescription: "no options",
        options: null,
        optionExamples: [true],
        hasFix: false,
        type: "maintainability",
        typescriptOnly: false,
        requiresTypeInfo: true,
    };
    /* tslint:enable:object-literal-sort-keys */

    public applyWithProgram(
        sourceFile: ts.SourceFile,
        program: ts.Program,
    ): Lint.RuleFailure[] {
        if (!Lint.isStrictNullChecksEnabled(program.getCompilerOptions())) {
            return [];
        }
        return this.applyWithWalker(
            new NumberNullCheckWalker(
                sourceFile,
                Rule.ruleName,
                program.getTypeChecker(),
            ),
        );
    }
}

class NumberNullCheckWalker extends Lint.AbstractWalker<void> {
    constructor(
        sourceFile: ts.SourceFile,
        ruleName: string,
        private readonly checker: ts.TypeChecker,
    ) {
        super(sourceFile, ruleName, undefined);
    }

    public walk(sourceFile: ts.SourceFile): void {
        const cb = (node: ts.Node): void => {
            if (node.kind === ts.SyntaxKind.IfStatement) {
                this.checkIdentifierOrUnaryInIfStatement(node as ts.IfStatement);
            }
            return ts.forEachChild(node, cb);
        };
        return ts.forEachChild(sourceFile, cb);
    }

    private checkIdentifierOrUnaryInIfStatement(node: ts.IfStatement) {
        const children = node.getChildren();

        children.forEach((child) => {
            if (!utils.isExpression(child)) {
                return;
            }
            const cchildren: ts.Node[] = (() => {
                if (child.kind === ts.SyntaxKind.PrefixUnaryExpression) {
                    return child.getChildAt(1).getChildren();
                } else {
                    const cc = child.getChildren();
                    if (cc.length === 0) {
                        return [child];
                    }
                    return cc;
                }
            })();

            cchildren.filter((c) => {
                if (utils.isIdentifier(c)) {
                    const type = this.checker.getTypeAtLocation(c);
                    if (utils.isUnionType(type)) {
                        return type.types.every((t) =>
                            utils.isTypeFlagSet(t, ts.TypeFlags.Number) ||
                            utils.isTypeFlagSet(t, ts.TypeFlags.Null) ||
                            utils.isTypeFlagSet(t, ts.TypeFlags.Undefined));
                    }
                }
                return false;
                })
                .forEach((_) => {
                    this.addFailure(child.getStart(), child.getEnd(), Rule.FAILURE_DESCRIPTION);
            });
        });
    }
}
