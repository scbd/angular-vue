const camelCase = _.camelCase;

export default [function () {
    return {
        restrict: 'A',
        terminal: true, // any directive with lower priority will be ignored
        priority: 1001, // 1 more than ngNonBindable => disable angular interpolation!
        link($scope, [element], attr ) {

            patchVModel(element, attr);

            const options  = $scope.$eval(attr.ngVue||"{}");
            const data     = {};
            const computed = {};
            const methods  = {};

            const managedProps = parseAttributes(attr);

            managedProps.filter(({type})=>type=='bind').forEach(({ rawAttribute, name, expression, modifiers }) => {

                const dataName = `ngVueDataWrapper_${name}`;

                data[dataName] = $scope.$eval(expression);

                computed[name] = { get: ( )=>data[dataName] };

                if(modifiers.includes('sync')) {

                    computed[name].set = (v)=>{
                        if($scope.$eval(expression) === v) return;

                        $scope.$apply(()=>{  
                            console.debug(`vue(${name}) => ng(${expression}):`, v)
                            $scope.$eval(`${expression} = $event`, { $event: v });
                        })
                    }
                }

                $scope.$watch(expression, (v)=>{ 
                    if(data[dataName] === v) return;
                    console.debug(`ng(${expression}) => vue(${name}): `, v)
                    data[dataName] = v
                });              
                
                element.attributes[rawAttribute].value = dataName;
            });

            managedProps.filter(({type})=>type=='event').forEach(({ rawAttribute, name, expression }) => {

                const methodName = `ngVueDelegateWrapper_${camelCase(name)}`;

                methods[methodName] = ($event) => {
                    $scope.$apply(()=>{  
                        console.debug(`vue(${name}) calling ng(${expression}):`, $event)
                        $scope.$eval(expression, { $event });
                    });
                }

                element.attributes[rawAttribute].value = `${methodName}($event)`;   
            });

            console.debug(element.outerHTML)

            const vm = new Vue({
                ...options,
                data,
                computed,
                methods,
            });

            $scope.$on("$destroy", ()=>{ vm.$destroy(); })

            vm.$mount(element);

            managedProps.filter(({type, modifiers})=>type=='bind' && modifiers.includes('sync')).forEach(({ name, expression, updateEvent }) => {
                vm.$children.forEach(c=> { 
                    c.$on(`update:${name}`, (v)=>{
                        $scope.$apply(()=>{  
                            console.debug(`vue(${updateEvent}) => ng(${expression}) =`, v)
                            $scope.$eval(`${expression} = $event`, { $event: v });
                        })
                    });
                })
            });
        }
    }
}];

const vBindRE = /^(?:v-bind:|:)(?<name>[a-z0-9-]+)(?<modifiers>(\.[a-z]+)*)$/i
const vOnRE   = /^(?:v-on:|@)(?<name>[a-z0-9-]+(?::[a-z0-9-]+)*)(?<modifiers>(\.[a-z]+)*)$/i
const vDirectivesRE = /^(?<name>v-model|v-html|v-text|v-show|v-class|v-attr|v-style|v-if)(?<modifiers>(\.[a-z]+)*)$/i;

function patchVModel(element, attr) {

    // replace v-model="myNgVal" with :value="myNgVal" & @input="myNgVal=$event.target.value"

    const vModelAttrKey = Object.keys(attr).find(key=>/^vModel\.?/.test(key));
    if(!vModelAttrKey) return;
    
    const expression = attr      [vModelAttrKey];
    const rawAttr    = attr.$attr[vModelAttrKey];
    const modifiers  = rawAttr.replace(/^v-model/i, '');

    delete attr      [vModelAttrKey];
    delete attr.$attr[vModelAttrKey];
    element.removeAttributeNode(element.attributes[rawAttr])

    attr      .value = expression;
    attr.$attr.value = `v-bind:value${modifiers}`;

    attr      .input = `${expression} = ($event.target ? $event.target.value : $event)`;
    attr.$attr.input = 'v-on:input';

    element.setAttribute(attr.$attr.value, attr.value)
    element.setAttribute(attr.$attr.input, attr.input)
}

function parseAttributes(attr) {

    const results = Object.keys(attr).map((ngAttrName) => {

        const rawAttribute =  attr.$attr[ngAttrName];
        const expression   =  attr[ngAttrName];

        if(vBindRE.test(rawAttribute)) {
            const { groups } = rawAttribute.match(vBindRE);
            const name       = camelCase(groups.name);
            const modifiers  = (groups.modifiers||'').split('.').filter(o=>o);
            const type       = 'bind';

            return { type, rawAttribute, name, expression, modifiers };
        }

        if(vDirectivesRE.test(rawAttribute)) {
            const { groups } = rawAttribute.match(vDirectivesRE);
            const name       = camelCase(groups.name);
            const modifiers  = (groups.modifiers||'').split('.').filter(o=>o);
            const type       = 'bind';

            return { type, rawAttribute, name, expression, modifiers };
        }

        if(vOnRE.test(rawAttribute)) {
            const { groups } = rawAttribute.match(vOnRE);
            const name       =  groups.name.split(':').map(p=>camelCase(p)).join(':');
            const modifiers  = (groups.modifiers||'').split('.').filter(o=>o);
            const type       = 'event';

            return { type, rawAttribute, name, expression, modifiers };
        }
    });

    return results.filter(o=>!!o);
}