import { injectable, named, inject } from "inversify";
import { AbstractTreeDecoratorService, TreeDecorator } from "@theia/core/lib/browser";
import { ContributionProvider } from "@theia/core";

export const DeviceTreeDecorator = Symbol('DeviceTreeDecorator');

@injectable()
export class DeviceViewDecoratorService extends AbstractTreeDecoratorService{
    constructor(@inject(ContributionProvider) @named(DeviceTreeDecorator) protected readonly contributions: ContributionProvider<TreeDecorator>) {
        super(contributions.getContributions());
    }
}