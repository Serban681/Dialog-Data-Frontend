'use client'

import { BigBtn, TagSystem } from "@/components/styled-components/Buttons";
import { SectionTitle } from "@/components/styled-components/SectionTitle";
import { ShopContext } from "@/context/ShopContext";
import useGetUser from "@/hooks/useGetUser";
import { addProductToCart } from "@/lib/cartRequests";
import { getProductById } from "@/lib/productRequests";
import { getVariancesForProduct } from "@/lib/productVarianceRequests";
import { Product } from "@/models/Product";
import { ProductVariance } from "@/models/ProductVariance";
import { useContext, useEffect, useState } from "react";

interface AttributeValuePair {
    attribute: string,
    value: string
}

export default function ProductPage({ params }: { params: { id: number}}) {

    const [product, setProduct] = useState<Product>();
    const [variances, setVariances] = useState<ProductVariance[]>([]);
    const [error, setError] = useState<string>('');

    const { user } = useGetUser();

    const { cart, setCart, notifierState, setNotifierState } = useContext(ShopContext)!;

    const [selectedAttributeValues, setSelectedAttributeValues] = useState<{
        attribute: string,
        value: string
    }[]>([]);
    const [groupedSelectedAttributeValues, setGroupedSelectedAttributeValues] = useState<string[]>([]);

    const handleAttributeValueSelection = (attribute: string, attributeValue: string) => {
        let newSelectedAttributeValues = selectedAttributeValues.map(elem => {
            if(elem.attribute === attribute) {
                elem.value = attributeValue
            }
            return elem
        })
        setSelectedAttributeValues(newSelectedAttributeValues)
        setGroupedSelectedAttributeValues(newSelectedAttributeValues.map(elem => elem.value))   
    }

    useEffect(() => {
        getProductById(params.id)
            .then(res => {
                setProduct(res)
                setSelectedAttributeValues(res.attributesAndAttributeValues.map(elem => ({attribute: elem.name, value: ''})))
            })
            .catch((err: Error) => setError(err.message));
        
        getVariancesForProduct(params.id) 
            .then(res => setVariances(res))
            .catch((err: Error) => setError(err.message))
    }, [])

    const canOrder = () : boolean => {
        return selectedAttributeValues.every(elem => elem.value !== '')
    }

    const findVarianceByAttributes = () : ProductVariance | null => {
        for(let variance of variances) {
            if(variance.attributesAndValues.every(elem => selectedAttributeValues.some(selectedElem => selectedElem.attribute === elem.name && selectedElem.value === elem.value))) {
                return variance
            }
        }

        return null
    }

    // const findVariancesForSelectedAttributes = (attributeValuePairs: AttributeValuePair[]) => {
    //     let possible_variances: ProductVariance[] = []

    //     for(let variance of variances) {
    //         // console.log(variance.attributesAndValues)
    //         variance.attributesAndValues.forEach(elem => console.log(elem))
    //         return
    //         // if(variance.attributesAndValues.every(elem => attributeValuePairs.some(attributeValuePair => attributeValuePair.attribute === elem.name && attributeValuePair.value === elem.value))) {
                

    //         //     // possible_variances.push(variance)
    //         // }
    //     }

    //     return possible_variances
    // }

    // useEffect(() => {
    //     console.log(findVariancesForSelectedAttributes([{
    //         attribute: 'size',
    //         value: 'L'
    //     }]))
    // }, [])

    const addToCartToggle = (productId: number) => {
        if(user.id === -1) {
            setNotifierState({ isError: true, message: 'You need to be logged in to order products'})
            return
        }

        if(canOrder()) {
            const variance = findVarianceByAttributes()
            addProductToCart(variance!.id, cart!.id)
                .then(res => setCart(res))
                .catch((err: Error) => setNotifierState({ isError: true, message: err.message}))
        }
    }

    return (
        <div>
            {
                !!error ? <p>{error}</p>
            :
                <>
                    <SectionTitle customStyles="mt-10">{product?.name}</SectionTitle>
                    <div className="flex flex-col md:flex-row justify-around mt-8">
                        <img className="w-full md:w-2/5" src={product?.photoUrl} alt={product?.name} />
                        <div>
                            {/* {variances.map()} */}
                            {product?.attributesAndAttributeValues.map((attribute, index) => (
                                <div key={index}>
                                    <h5 className="font-medium text-xl capitalize">{attribute.name}</h5> 
                                    <div>
                                        <TagSystem
                                            tags={attribute.values}
                                            selectedTags={groupedSelectedAttributeValues}
                                            handleTagSelection={(attributeValue) => handleAttributeValueSelection(attribute.name, attributeValue)}
                                            customStyles="mr-5"
                                            />
                                    </div>
                                </div>
                            ))}
                            <BigBtn handleClick={() => addToCartToggle(product?.id!)} active={canOrder()} customStyles="mt-8">Add to cart</BigBtn>
                        </div>
                    </div>
                </>
            }
        </div>
    )
}
