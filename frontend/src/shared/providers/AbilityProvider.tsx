import React, { createContext, useContext, useMemo } from 'react';
import { createMongoAbility, MongoAbility, RawRuleOf } from '@casl/ability';
import { AbilityProvider as CaslAbilityProvider, useAbility, Can } from '@casl/react';
import type { ErpAction, ErpSubjectCode } from '../contracts/permissions';

export type AppAbility = MongoAbility<[ErpAction, ErpSubjectCode | 'all' | (string & {})]>;

const defaultAbility = createMongoAbility<AppAbility>([]);

export const AbilityContext = createContext<AppAbility>(defaultAbility);

export function AbilityProvider({
  rules,
  children,
}: {
  rules?: RawRuleOf<AppAbility>[];
  children: React.ReactNode;
}) {
  const ability = useMemo(() => {
    return createMongoAbility<AppAbility>(rules || []);
  }, [rules]);

  return (
    <CaslAbilityProvider value={ability as any}>
      <AbilityContext.Provider value={ability}>
        {children}
      </AbilityContext.Provider>
    </CaslAbilityProvider>
  );
}

export function useCan() {
  const ability = useContext(AbilityContext);
  return (action: string, subject: string, field?: string) => {
    return ability.can(action as any, subject as any, field);
  };
}

export { Can, useAbility };
